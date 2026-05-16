import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { aiExtractions, documents } from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/**
 * Queue of pending AI extractions. Stage 3c stub —
 * returns empty list until actual extraction service exists (Stage 4).
 */
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
        documentScope: documents.scope,
        documentClubId: documents.clubId,
      })
      .from(aiExtractions)
      .innerJoin(documents, eq(documents.id, aiExtractions.documentId))
      .orderBy(desc(aiExtractions.createdAt));

    const filtered = isFederationAdmin
      ? rows
      : rows.filter((r) => r.documentScope === "federation" || r.documentClubId === clubId);

    res.json({ extractions: filtered });
  } catch (e) {
    next(e);
  }
});

export default router;
