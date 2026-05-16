import { Router } from "express";
import { and, count, eq, gte, sql as drizzleSql } from "drizzle-orm";
import { db } from "../db/client.js";
import { clubs, users, athletes, competitions, aiExtractions } from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth);

/** Federation-wide stats (federation_admin only). */
router.get("/federation", requireRole("federation_admin"), async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [{ totalClubs }] = await db
      .select({ totalClubs: count() })
      .from(clubs);

    const [{ totalAthletes }] = await db
      .select({ totalAthletes: count() })
      .from(athletes)
      .where(eq(athletes.isActive, true));

    const [{ totalCoaches }] = await db
      .select({ totalCoaches: count() })
      .from(users)
      .where(and(eq(users.role, "coach"), eq(users.isActive, true)));

    const [{ upcomingCompetitions }] = await db
      .select({ upcomingCompetitions: count() })
      .from(competitions)
      .where(gte(competitions.endDate, today));

    const [{ pendingAIReviews }] = await db
      .select({ pendingAIReviews: count() })
      .from(aiExtractions)
      .where(eq(aiExtractions.status, "pending"));

    res.json({
      stats: {
        totalClubs: Number(totalClubs),
        totalAthletes: Number(totalAthletes),
        totalCoaches: Number(totalCoaches),
        upcomingCompetitions: Number(upcomingCompetitions),
        pendingAIReviews: Number(pendingAIReviews),
        activeSeasons: 1, // computed elsewhere; placeholder
      },
    });
  } catch (e) {
    next(e);
  }
});

/** Club-scoped stats (club_admin sees own club; federation_admin can pass clubId query). */
router.get("/club", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const { isFederationAdmin, clubId: callerClubId } = tenantClubFilter(req);
    const requestedClubId = (req.query.clubId as string | undefined) ?? callerClubId;
    if (!requestedClubId) throw new HttpError(400, "club_id_required");
    if (!isFederationAdmin && requestedClubId !== callerClubId) throw new HttpError(403, "forbidden");

    const today = new Date().toISOString().slice(0, 10);

    const [{ athletesCount }] = await db
      .select({ athletesCount: count() })
      .from(athletes)
      .where(and(eq(athletes.clubId, requestedClubId), eq(athletes.isActive, true)));

    const [{ coachesCount }] = await db
      .select({ coachesCount: count() })
      .from(users)
      .where(and(eq(users.clubId, requestedClubId), eq(users.role, "coach"), eq(users.isActive, true)));

    const [{ parentsCount }] = await db
      .select({ parentsCount: count() })
      .from(users)
      .where(and(eq(users.clubId, requestedClubId), eq(users.role, "parent"), eq(users.isActive, true)));

    const [{ upcomingCompetitions }] = await db
      .select({ upcomingCompetitions: count() })
      .from(competitions)
      .where(gte(competitions.endDate, today));

    res.json({
      stats: {
        athletesCount: Number(athletesCount),
        coachesCount: Number(coachesCount),
        parentsCount: Number(parentsCount),
        upcomingCompetitions: Number(upcomingCompetitions),
        pendingAIReviews: 0,
      },
    });
  } catch (e) {
    next(e);
  }
});

// Reference to drizzleSql to keep import (avoids unused-import lint if checks tighten)
void drizzleSql;

export default router;
