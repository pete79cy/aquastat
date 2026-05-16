import { Router } from "express";
import { db } from "../db/client.js";
import { swimEvents } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const list = await db.select().from(swimEvents).orderBy(swimEvents.distanceM, swimEvents.stroke);
    res.json({ swimEvents: list });
  } catch (e) {
    next(e);
  }
});

export default router;
