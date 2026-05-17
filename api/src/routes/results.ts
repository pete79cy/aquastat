import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { competitionResults, trainingResults, athletes, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth);

// ─── Competition results ───────────────────────────────────────────────────
const competitionResultSchema = z.object({
  athleteId: z.uuid(),
  competitionId: z.uuid(),
  swimEventId: z.uuid(),
  resultTimeMs: z.number().int().positive(),
  rank: z.number().int().positive().optional(),
  roundType: z.enum(["heat", "final", "direct_final", "training_race", "unknown"]).default("unknown"),
  poolType: z.enum(["25m", "50m", "unknown"]),
});

router.post("/competition", requireRole("federation_admin", "club_admin", "coach"), async (req, res, next) => {
  try {
    const u = req.user!;
    const payload = competitionResultSchema.parse(req.body);

    // Verify access to athlete
    const [a] = await db.select().from(athletes).where(eq(athletes.id, payload.athleteId)).limit(1);
    if (!a) throw new HttpError(404, "athlete_not_found");
    if (u.role === "coach" && a.coachId !== u.sub) throw new HttpError(403, "forbidden");
    if (u.role === "club_admin" && a.clubId !== u.clubId) throw new HttpError(403, "forbidden");

    const [created] = await db.insert(competitionResults).values({
      ...payload,
      createdBy: u.sub,
      verificationStatus: "pending",
    }).returning();
    res.status(201).json({ result: created });
  } catch (e) {
    next(e);
  }
});

/** Helper: ensure caller can mutate a given competition_result row. */
async function assertResultAccess(req: Express.Request & { user?: { sub: string; role: string; clubId: string | null } }, resultId: string) {
  const u = req.user!;
  const [r] = await db.select().from(competitionResults).where(eq(competitionResults.id, resultId)).limit(1);
  if (!r) throw new HttpError(404, "result_not_found");
  const [a] = await db.select().from(athletes).where(eq(athletes.id, r.athleteId)).limit(1);
  if (!a) throw new HttpError(404, "athlete_not_found");
  if (u.role === "federation_admin") return { r, a };
  if (u.role === "club_admin" && a.clubId === u.clubId) return { r, a };
  if (u.role === "coach" && a.coachId === u.sub) return { r, a };
  throw new HttpError(404, "result_not_found");
}

/** Edit a competition result. Coach can edit their athletes' results.
 *  Status cannot be changed via this endpoint — use /status. */
const updateResultSchema = z.object({
  resultTimeMs: z.number().int().positive().optional(),
  rank: z.number().int().positive().nullable().optional(),
  roundType: z.enum(["heat", "final", "direct_final", "training_race", "unknown"]).optional(),
  poolType: z.enum(["25m", "50m", "unknown"]).optional(),
});

router.patch("/competition/:id", requireRole("federation_admin", "club_admin", "coach"), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await assertResultAccess(req, id);
    const payload = updateResultSchema.parse(req.body);

    const [updated] = await db
      .update(competitionResults)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(competitionResults.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: req.user!.sub,
      action: "competition_result.edited",
      entityType: "competition_result",
      entityId: id,
      newValueJson: payload,
      ip: req.ip ?? null,
    });

    res.json({ result: updated });
  } catch (e) {
    next(e);
  }
});

/** Change verification_status (admin only). */
const statusSchema = z.object({
  verificationStatus: z.enum(["pending", "verified", "rejected"]),
});

router.patch("/competition/:id/status", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await assertResultAccess(req, id);
    const { verificationStatus } = statusSchema.parse(req.body);

    const [updated] = await db
      .update(competitionResults)
      .set({ verificationStatus, updatedAt: new Date() })
      .where(eq(competitionResults.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: req.user!.sub,
      action: `competition_result.${verificationStatus}`,
      entityType: "competition_result",
      entityId: id,
      ip: req.ip ?? null,
    });

    res.json({ result: updated });
  } catch (e) {
    next(e);
  }
});

/** Delete a competition result. Coach can delete their own contributions. */
router.delete("/competition/:id", requireRole("federation_admin", "club_admin", "coach"), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { r } = await assertResultAccess(req, id);
    const u = req.user!;
    // Coach can only delete results they created
    if (u.role === "coach" && r.createdBy !== u.sub) {
      throw new HttpError(403, "coach_can_only_delete_own_entries");
    }
    await db.delete(competitionResults).where(eq(competitionResults.id, id));
    await db.insert(auditLogs).values({
      userId: u.sub,
      action: "competition_result.deleted",
      entityType: "competition_result",
      entityId: id,
      oldValueJson: { resultTimeMs: r.resultTimeMs, athleteId: r.athleteId },
      ip: req.ip ?? null,
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ─── Training results ─────────────────────────────────────────────────────
const trainingResultSchema = z.object({
  athleteId: z.uuid(),
  swimEventId: z.uuid(),
  resultTimeMs: z.number().int().positive(),
  date: z.iso.date(),
  trainingType: z.enum(["test", "time_trial", "race_simulation", "set_result", "coach_observation"]),
  trainingContext: z.enum(["normal", "heavy_fatigue", "taper", "after_gym", "before_competition", "technical_test"]).default("normal"),
  notes: z.string().optional(),
});

router.post("/training", requireRole("federation_admin", "club_admin", "coach"), async (req, res, next) => {
  try {
    const u = req.user!;
    const payload = trainingResultSchema.parse(req.body);

    const [a] = await db.select().from(athletes).where(eq(athletes.id, payload.athleteId)).limit(1);
    if (!a) throw new HttpError(404, "athlete_not_found");
    if (u.role === "coach" && a.coachId !== u.sub) throw new HttpError(403, "forbidden");
    if (u.role === "club_admin" && a.clubId !== u.clubId) throw new HttpError(403, "forbidden");

    const [created] = await db.insert(trainingResults).values({
      ...payload,
      clubId: a.clubId,
      coachId: u.role === "coach" ? u.sub : (u.role === "club_admin" ? null : null),
    }).returning();
    res.status(201).json({ result: created });
  } catch (e) {
    next(e);
  }
});

router.get("/training/athlete/:athleteId", async (req, res, next) => {
  try {
    const u = req.user!;
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    const [a] = await db.select().from(athletes).where(eq(athletes.id, String(req.params.athleteId))).limit(1);
    if (!a) throw new HttpError(404, "not_found");
    if (!isFederationAdmin && a.clubId !== clubId) throw new HttpError(404, "not_found");
    if (u.role === "coach" && a.coachId !== u.sub) throw new HttpError(403, "forbidden");

    const list = await db
      .select()
      .from(trainingResults)
      .where(eq(trainingResults.athleteId, a.id))
      .orderBy(trainingResults.date);
    res.json({ results: list });
  } catch (e) {
    next(e);
  }
});

export default router;
