import { Router } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { documents, aiExtractions, aiExtractedItems } from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { env } from "../lib/env.js";
import { ensureUploadDir, uploadPathFor } from "../lib/storage.js";
import { extractProclamation, extractResults } from "../lib/extraction.js";
import { isAiAvailable } from "../lib/anthropic.js";
import { logger } from "../lib/logger.js";

ensureUploadDir();

const upload = multer({
  storage: multer.diskStorage({
    destination: env.UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ts = Date.now();
      const safe = file.originalname.replace(/[^a-zA-Z0-9._Ͱ-Ͽἀ-῿-]/g, "_");
      const rand = crypto.randomBytes(4).toString("hex");
      cb(null, `${ts}-${rand}-${safe}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only PDF/DOC/DOCX uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

// ─── Upload ────────────────────────────────────────────────────────────────
router.post(
  "/upload",
  requireRole("federation_admin", "club_admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const u = req.user!;
      const { isFederationAdmin, clubId: callerClubId } = tenantClubFilter(req);
      if (!req.file) throw new HttpError(400, "no_file");

      const documentType = (req.body.documentType as string) ?? "season_proclamation";
      const scope: "federation" | "club" = isFederationAdmin ? "federation" : "club";
      const clubId = scope === "club" ? callerClubId : null;
      const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
      const fileType = ext === "pdf" ? "pdf" : ext === "docx" ? "docx" : ext === "doc" ? "doc" : "other";

      const [doc] = await db
        .insert(documents)
        .values({
          scope,
          clubId,
          filename: req.file.filename,
          originalFilename: req.file.originalname,
          fileType: fileType as "pdf" | "doc" | "docx" | "other",
          documentType: documentType as
            | "season_proclamation"
            | "results_pdf"
            | "standards_pdf"
            | "records_pdf"
            | "other",
          storageUrl: req.file.path,
          uploadedBy: u.sub,
          processingStatus: "uploaded",
        })
        .returning();

      res.status(201).json({ document: doc });
    } catch (e) {
      next(e);
    }
  }
);

// ─── List + get ────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    const all = await db.select().from(documents).orderBy(desc(documents.uploadedAt));
    const visible = isFederationAdmin
      ? all
      : all.filter((d) => d.scope === "federation" || d.clubId === clubId);
    res.json({ documents: visible });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc) throw new HttpError(404, "not_found");
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    if (!isFederationAdmin && doc.scope !== "federation" && doc.clubId !== clubId) {
      throw new HttpError(404, "not_found");
    }
    res.json({ document: doc });
  } catch (e) {
    next(e);
  }
});

// ─── Trigger AI extraction ─────────────────────────────────────────────────
router.post(
  "/:id/process",
  requireRole("federation_admin", "club_admin"),
  async (req, res, next) => {
    try {
      if (!isAiAvailable()) {
        throw new HttpError(503, "ai_not_configured", "ANTHROPIC_API_KEY missing on server");
      }
      const id = String(req.params.id);
      const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      if (!doc) throw new HttpError(404, "not_found");

      const { isFederationAdmin, clubId } = tenantClubFilter(req);
      if (!isFederationAdmin && doc.scope !== "federation" && doc.clubId !== clubId) {
        throw new HttpError(404, "not_found");
      }

      // Update to processing
      await db
        .update(documents)
        .set({ processingStatus: "processing" })
        .where(eq(documents.id, id));

      const filepath = uploadPathFor(doc.filename);

      try {
        let extractionType: "competitions" | "results";
        let confidence: number;
        let rawJson: unknown;
        let items: Array<{ itemType: string; data: unknown }>;

        if (doc.documentType === "results_pdf") {
          const r = await extractResults(filepath);
          extractionType = "results";
          confidence = r.confidencePercent;
          rawJson = r.data;
          items = r.data.results.map((res) => ({
            itemType: "result",
            data: res,
          }));
        } else {
          // Default to proclamation
          const r = await extractProclamation(filepath);
          extractionType = "competitions";
          confidence = r.confidencePercent;
          rawJson = r.data;
          items = [
            ...r.data.competitions.map((c) => ({ itemType: "competition" as const, data: c })),
            ...r.data.ageCategories.map((c) => ({ itemType: "age_category" as const, data: c })),
            ...r.data.qualificationStandards.map((s) => ({
              itemType: "qualification_standard" as const,
              data: s,
            })),
          ];
        }

        // Persist extraction + items
        const [extraction] = await db
          .insert(aiExtractions)
          .values({
            documentId: id,
            extractionType,
            rawOutputJson: rawJson as object,
            confidence: confidence.toString(),
            status: "pending",
          })
          .returning();

        if (items.length > 0) {
          await db.insert(aiExtractedItems).values(
            items.map((item) => ({
              aiExtractionId: extraction.id,
              itemType: item.itemType,
              extractedJson: item.data as object,
              confidence: confidence.toString(),
              status: "pending" as const,
            }))
          );
        }

        await db
          .update(documents)
          .set({ processingStatus: items.length > 0 ? "needs_review" : "completed" })
          .where(eq(documents.id, id));

        res.json({
          extraction,
          itemCount: items.length,
          confidence,
        });
      } catch (extractionErr) {
        logger.error({ err: extractionErr, documentId: id }, "extraction_failed");
        await db
          .update(documents)
          .set({ processingStatus: "failed" })
          .where(eq(documents.id, id));
        throw new HttpError(500, "extraction_failed", (extractionErr as Error).message);
      }
    } catch (e) {
      next(e);
    }
  }
);

export default router;
