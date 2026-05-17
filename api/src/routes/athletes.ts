import { Router } from "express";
import { z } from "zod";
import { and, eq, inArray, desc, or } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  athletes, parentAthleteLinks, competitionResults, swimEvents, ageCategories,
  qualificationStandards, seasons, trainingResults,
} from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/athletes
 * - federation_admin: all athletes
 * - club_admin: athletes in own club
 * - coach: athletes assigned to them
 * - parent: only linked athletes
 */
router.get("/", async (req, res, next) => {
  try {
    const u = req.user!;
    const { isFederationAdmin, clubId } = tenantClubFilter(req);

    if (u.role === "parent") {
      const links = await db
        .select({ athleteId: parentAthleteLinks.athleteId })
        .from(parentAthleteLinks)
        .where(eq(parentAthleteLinks.parentUserId, u.sub));
      const ids = links.map((l) => l.athleteId);
      const list = ids.length
        ? await db.select().from(athletes).where(inArray(athletes.id, ids))
        : [];
      res.json({ athletes: list });
      return;
    }

    if (u.role === "coach") {
      const list = await db
        .select()
        .from(athletes)
        .where(eq(athletes.coachId, u.sub));
      res.json({ athletes: list });
      return;
    }

    if (isFederationAdmin) {
      const list = await db.select().from(athletes).orderBy(athletes.lastName);
      res.json({ athletes: list });
      return;
    }

    if (!clubId) throw new HttpError(403, "club_required");
    const list = await db.select().from(athletes).where(eq(athletes.clubId, clubId)).orderBy(athletes.lastName);
    res.json({ athletes: list });
  } catch (e) {
    next(e);
  }
});

async function assertAccess(req: Express.Request & { user?: { sub: string; role: string; clubId: string | null } }, athleteId: string) {
  const u = req.user!;
  const [a] = await db.select().from(athletes).where(eq(athletes.id, athleteId)).limit(1);
  if (!a) throw new HttpError(404, "not_found");

  if (u.role === "federation_admin") return a;
  if (u.role === "club_admin" && u.clubId === a.clubId) return a;
  if (u.role === "coach" && a.coachId === u.sub) return a;
  if (u.role === "parent") {
    const [link] = await db
      .select()
      .from(parentAthleteLinks)
      .where(and(eq(parentAthleteLinks.parentUserId, u.sub), eq(parentAthleteLinks.athleteId, a.id)))
      .limit(1);
    if (link) return a;
  }
  throw new HttpError(404, "not_found");
}

router.get("/:id", async (req, res, next) => {
  try {
    const athlete = await assertAccess(req, String(req.params.id));
    res.json({ athlete });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/results", async (req, res, next) => {
  try {
    await assertAccess(req, String(req.params.id));
    const list = await db
      .select({
        id: competitionResults.id,
        timeMs: competitionResults.resultTimeMs,
        rank: competitionResults.rank,
        poolType: competitionResults.poolType,
        roundType: competitionResults.roundType,
        verificationStatus: competitionResults.verificationStatus,
        eventDisplay: swimEvents.displayName,
        distanceM: swimEvents.distanceM,
        stroke: swimEvents.stroke,
        gender: swimEvents.gender,
        createdAt: competitionResults.createdAt,
      })
      .from(competitionResults)
      .innerJoin(swimEvents, eq(swimEvents.id, competitionResults.swimEventId))
      .where(eq(competitionResults.athleteId, String(req.params.id)))
      .orderBy(desc(competitionResults.createdAt));
    res.json({ results: list });
  } catch (e) {
    next(e);
  }
});

/** Training results for athlete (chronological). */
router.get("/:id/training-results", async (req, res, next) => {
  try {
    await assertAccess(req, String(req.params.id));
    const list = await db
      .select({
        id: trainingResults.id,
        timeMs: trainingResults.resultTimeMs,
        date: trainingResults.date,
        trainingType: trainingResults.trainingType,
        trainingContext: trainingResults.trainingContext,
        notes: trainingResults.notes,
        eventDisplay: swimEvents.displayName,
        distanceM: swimEvents.distanceM,
        stroke: swimEvents.stroke,
      })
      .from(trainingResults)
      .innerJoin(swimEvents, eq(swimEvents.id, trainingResults.swimEventId))
      .where(eq(trainingResults.athleteId, String(req.params.id)))
      .orderBy(desc(trainingResults.date));
    res.json({ results: list });
  } catch (e) {
    next(e);
  }
});

/**
 * Qualification standards applicable to an athlete given their gender + age.
 * Returns standards matched on (active season, gender or any, category matches
 * athlete birth year). Frontend can compare against best times.
 */
router.get("/:id/standards-comparison", async (req, res, next) => {
  try {
    const athlete = await assertAccess(req, String(req.params.id));
    const [active] = await db.select().from(seasons).where(eq(seasons.status, "active")).limit(1);
    if (!active) {
      res.json({ standards: [], season: null });
      return;
    }

    const year = new Date(athlete.dateOfBirth).getUTCFullYear();
    const cats = await db.select().from(ageCategories).where(eq(ageCategories.seasonId, active.id));
    const applicableCategoryIds = cats
      .filter((c) => {
        const fromOk = c.birthYearFrom == null || year >= c.birthYearFrom;
        const toOk = c.birthYearTo == null || year <= c.birthYearTo;
        const genderOk = c.genderScope === "any" || c.genderScope === athlete.gender;
        return fromOk && toOk && genderOk;
      })
      .map((c) => c.id);

    const rows = await db
      .select({
        id: qualificationStandards.id,
        standardType: qualificationStandards.standardType,
        gender: qualificationStandards.gender,
        timeMs: qualificationStandards.timeMs,
        eventDisplay: swimEvents.displayName,
        distanceM: swimEvents.distanceM,
        stroke: swimEvents.stroke,
        categoryEl: ageCategories.nameEl,
      })
      .from(qualificationStandards)
      .innerJoin(swimEvents, eq(swimEvents.id, qualificationStandards.swimEventId))
      .leftJoin(ageCategories, eq(ageCategories.id, qualificationStandards.categoryId))
      .where(
        and(
          eq(qualificationStandards.seasonId, active.id),
          or(
            eq(qualificationStandards.gender, athlete.gender),
            eq(qualificationStandards.gender, "any")
          ),
          applicableCategoryIds.length > 0
            ? inArray(qualificationStandards.categoryId, applicableCategoryIds)
            : eq(qualificationStandards.categoryId, qualificationStandards.categoryId) // no filter
        )
      );

    res.json({ standards: rows, season: { id: active.id, name: active.name } });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  clubId: z.uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.iso.date(),
  gender: z.enum(["male", "female", "mixed", "any"]),
  coachId: z.uuid().optional(),
  registrationNumber: z.string().optional(),
});

router.post("/", requireRole("federation_admin", "club_admin", "coach"), async (req, res, next) => {
  try {
    const u = req.user!;
    const { isFederationAdmin, clubId: callerClubId } = tenantClubFilter(req);
    const payload = createSchema.parse(req.body);

    // Coach can only create athletes in their own club and must assign self as coach
    if (u.role === "coach") {
      if (payload.clubId !== callerClubId) throw new HttpError(403, "wrong_club_scope");
      payload.coachId = u.sub; // force-assign self
    } else if (!isFederationAdmin && payload.clubId !== callerClubId) {
      throw new HttpError(403, "wrong_club_scope");
    }

    const [a] = await db.insert(athletes).values(payload).returning();
    res.status(201).json({ athlete: a });
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/:id",
  requireRole("federation_admin", "club_admin", "coach"),
  async (req, res, next) => {
    try {
      const u = req.user!;
      await assertAccess(req, String(req.params.id));
      const payload = createSchema.partial().omit({ clubId: true }).parse(req.body);

      // Coach cannot reassign the athlete to a different coach
      if (u.role === "coach" && payload.coachId && payload.coachId !== u.sub) {
        throw new HttpError(403, "coach_cannot_reassign");
      }

      const [a] = await db
        .update(athletes)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(athletes.id, String(req.params.id)))
        .returning();
      res.json({ athlete: a });
    } catch (e) {
      next(e);
    }
  }
);

/** Toggle active flag */
router.patch(
  "/:id/active",
  requireRole("federation_admin", "club_admin"),
  async (req, res, next) => {
    try {
      const isActive = Boolean(req.body?.isActive);
      await assertAccess(req, String(req.params.id));
      const [a] = await db
        .update(athletes)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(athletes.id, String(req.params.id)))
        .returning();
      res.json({ athlete: a });
    } catch (e) {
      next(e);
    }
  }
);

/** Derive age category for an athlete given a season's categories. */
export async function computeCategoryForAthlete(athleteId: string, seasonId: string): Promise<string | null> {
  const [a] = await db.select().from(athletes).where(eq(athletes.id, athleteId)).limit(1);
  if (!a) return null;
  const year = new Date(a.dateOfBirth).getUTCFullYear();
  const cats = await db.select().from(ageCategories).where(eq(ageCategories.seasonId, seasonId));
  const match = cats.find((c) => {
    const fromOk = c.birthYearFrom == null || year >= c.birthYearFrom;
    const toOk = c.birthYearTo == null || year <= c.birthYearTo;
    const genderOk = c.genderScope === "any" || c.genderScope === a.gender;
    return fromOk && toOk && genderOk;
  });
  return match?.id ?? null;
}

export default router;
