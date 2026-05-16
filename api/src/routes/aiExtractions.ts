import { Router } from "express";
import { z } from "zod";
import { desc, eq, and, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { aiExtractions, aiExtractedItems, documents, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { mapApprovedItem } from "../lib/mapping.js";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(requireAuth);

// ─── List queue ────────────────────────────────────────────────────────────
router.get("/", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    const rows = await db
      .select({
        id: aiExtractions.id,
        extractionType: aiExtractions.extractionType,
        confidence: aiExtractions.confidence,
        status: aiExtractions.status,
        createdAt: aiExtractions.createdAt,
        documentId: documents.id,
        documentFilename: documents.originalFilename,
        documentType: documents.documentType,
        documentScope: documents.scope,
        documentClubId: documents.clubId,
      })
      .from(aiExtractions)
      .innerJoin(documents, eq(documents.id, aiExtractions.documentId))
      .orderBy(desc(aiExtractions.createdAt));

    const visible = isFederationAdmin
      ? rows
      : rows.filter((r) => r.documentScope === "federation" || r.documentClubId === clubId);

    res.json({ extractions: visible });
  } catch (e) {
    next(e);
  }
});

// ─── List items for an extraction ──────────────────────────────────────────
router.get(
  "/:id/items",
  requireRole("federation_admin", "club_admin"),
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const items = await db
        .select()
        .from(aiExtractedItems)
        .where(eq(aiExtractedItems.aiExtractionId, id));
      res.json({ items });
    } catch (e) {
      next(e);
    }
  }
);

// ─── Approve / reject / edit item ──────────────────────────────────────────
const editSchema = z.object({
  extractedJson: z.record(z.string(), z.unknown()),
  reviewerNotes: z.string().optional(),
});

router.post(
  "/items/:itemId/approve",
  requireRole("federation_admin", "club_admin"),
  async (req, res, next) => {
    try {
      const itemId = String(req.params.itemId);

      // Load item to know its type + payload
      const [item] = await db
        .select()
        .from(aiExtractedItems)
        .where(eq(aiExtractedItems.id, itemId))
        .limit(1);
      if (!item) throw new HttpError(404, "not_found");
      if (item.status === "approved") {
        res.json({ item, mapped: null, note: "already_approved" });
        return;
      }

      // Try to map → create/update real entity
      let mapped: Awaited<ReturnType<typeof mapApprovedItem>> | null = null;
      let mapError: string | null = null;
      try {
        mapped = await mapApprovedItem(
          db,
          item.itemType,
          item.extractedJson as Record<string, unknown>
        );
      } catch (err) {
        mapError = (err as Error).message;
        logger.warn({ itemId, itemType: item.itemType, err: mapError }, "ai_item_mapping_failed");
      }

      // Update item status + mappedEntity
      const [updated] = await db
        .update(aiExtractedItems)
        .set({
          status: "approved",
          mappedEntityType: mapped?.entityType ?? null,
          mappedEntityId: mapped?.entityId ?? null,
          reviewerNotes: mapError ? `Mapped with error: ${mapError}` : null,
        })
        .where(eq(aiExtractedItems.id, itemId))
        .returning();

      // Audit
      await db.insert(auditLogs).values({
        userId: req.user!.sub,
        action: mapped ? "ai_item.approved_and_mapped" : "ai_item.approved_no_mapping",
        entityType: "ai_extracted_item",
        entityId: itemId,
        newValueJson: mapped ? { ...mapped } : { error: mapError },
        ip: req.ip ?? null,
      });

      res.json({ item: updated, mapped, mapError });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/items/:itemId/reject",
  requireRole("federation_admin", "club_admin"),
  async (req, res, next) => {
    try {
      const itemId = String(req.params.itemId);
      const [updated] = await db
        .update(aiExtractedItems)
        .set({ status: "rejected", reviewerNotes: (req.body?.reason as string) ?? null })
        .where(eq(aiExtractedItems.id, itemId))
        .returning();
      if (!updated) throw new HttpError(404, "not_found");
      await db.insert(auditLogs).values({
        userId: req.user!.sub,
        action: "ai_item.rejected",
        entityType: "ai_extracted_item",
        entityId: itemId,
        ip: req.ip ?? null,
      });
      res.json({ item: updated });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/items/:itemId",
  requireRole("federation_admin", "club_admin"),
  async (req, res, next) => {
    try {
      const itemId = String(req.params.itemId);
      const { extractedJson, reviewerNotes } = editSchema.parse(req.body);
      const [updated] = await db
        .update(aiExtractedItems)
        .set({
          extractedJson,
          reviewerNotes: reviewerNotes ?? null,
          status: "edited",
        })
        .where(eq(aiExtractedItems.id, itemId))
        .returning();
      if (!updated) throw new HttpError(404, "not_found");
      await db.insert(auditLogs).values({
        userId: req.user!.sub,
        action: "ai_item.edited",
        entityType: "ai_extracted_item",
        entityId: itemId,
        ip: req.ip ?? null,
      });
      res.json({ item: updated });
    } catch (e) {
      next(e);
    }
  }
);

// ─── Bulk approve high-confidence ──────────────────────────────────────────
router.post(
  "/:id/bulk-approve-high",
  requireRole("federation_admin", "club_admin"),
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const threshold = Number(req.body?.minConfidence ?? 90);

      const candidates = await db
        .select()
        .from(aiExtractedItems)
        .where(
          and(
            eq(aiExtractedItems.aiExtractionId, id),
            eq(aiExtractedItems.status, "pending")
          )
        );

      const toApprove = candidates.filter(
        (i) => Number(i.confidence ?? 0) >= threshold
      );

      if (toApprove.length === 0) {
        res.json({ approved: 0 });
        return;
      }

      await db
        .update(aiExtractedItems)
        .set({ status: "approved" })
        .where(
          inArray(
            aiExtractedItems.id,
            toApprove.map((i) => i.id)
          )
        );

      await db.insert(auditLogs).values({
        userId: req.user!.sub,
        action: "ai_extraction.bulk_approved",
        entityType: "ai_extraction",
        entityId: id,
        newValueJson: { approvedCount: toApprove.length, threshold },
        ip: req.ip ?? null,
      });

      res.json({ approved: toApprove.length });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
