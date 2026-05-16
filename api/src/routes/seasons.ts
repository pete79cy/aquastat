import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { seasons, ageCategories } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/active", async (_req, res, next) => {
  try {
    const [active] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.status, "active"))
      .orderBy(desc(seasons.startDate))
      .limit(1);
    res.json({ season: active ?? null });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const list = await db.select().from(seasons).orderBy(desc(seasons.startDate));
    res.json({ seasons: list });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/categories", async (req, res, next) => {
  try {
    const list = await db
      .select()
      .from(ageCategories)
      .where(eq(ageCategories.seasonId, String(req.params.id)))
      .orderBy(ageCategories.birthYearTo);
    res.json({ ageCategories: list });
  } catch (e) {
    next(e);
  }
});

export default router;
