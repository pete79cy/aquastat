import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { qualificationStandards, ageCategories, swimEvents } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const seasonId = (req.query.seasonId as string | undefined) ?? null;
    const baseQuery = db
      .select({
        id: qualificationStandards.id,
        standardType: qualificationStandards.standardType,
        gender: qualificationStandards.gender,
        timeMs: qualificationStandards.timeMs,
        validFrom: qualificationStandards.validFrom,
        validUntil: qualificationStandards.validUntil,
        categoryEl: ageCategories.nameEl,
        categoryEn: ageCategories.nameEn,
        eventDisplay: swimEvents.displayName,
        distanceM: swimEvents.distanceM,
        stroke: swimEvents.stroke,
      })
      .from(qualificationStandards)
      .leftJoin(ageCategories, eq(qualificationStandards.categoryId, ageCategories.id))
      .innerJoin(swimEvents, eq(qualificationStandards.swimEventId, swimEvents.id));

    const list = seasonId
      ? await baseQuery.where(eq(qualificationStandards.seasonId, seasonId))
      : await baseQuery;
    res.json({ standards: list });
  } catch (e) {
    next(e);
  }
});

export default router;
