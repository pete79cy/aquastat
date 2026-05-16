import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { competitions, competitionProgramItems } from "../db/schema.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const list = await db.select().from(competitions).orderBy(competitions.startDate);
    res.json({ competitions: list });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [c] = await db.select().from(competitions).where(eq(competitions.id, String(req.params.id))).limit(1);
    if (!c) throw new HttpError(404, "not_found");
    const program = await db
      .select()
      .from(competitionProgramItems)
      .where(eq(competitionProgramItems.competitionId, c.id))
      .orderBy(competitionProgramItems.dayDate, competitionProgramItems.eventOrder);
    res.json({ competition: c, program });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  seasonId: z.uuid(),
  name: z.string().min(2),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  location: z.string().optional(),
  venue: z.string().optional(),
  poolType: z.enum(["25m", "50m", "unknown"]).default("unknown"),
  declarationDeadline: z.iso.datetime().optional(),
  maxEventsPerAthlete: z.number().int().positive().optional(),
});

router.post("/", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const insertValues: typeof competitions.$inferInsert = {
      ...payload,
      declarationDeadline: payload.declarationDeadline ? new Date(payload.declarationDeadline) : null,
    };
    const [c] = await db.insert(competitions).values(insertValues).returning();
    res.status(201).json({ competition: c });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const payload = createSchema.partial().parse(req.body);
    const { declarationDeadline, ...rest } = payload;
    const updateValues = {
      ...rest,
      ...(declarationDeadline !== undefined
        ? { declarationDeadline: declarationDeadline ? new Date(declarationDeadline) : null }
        : {}),
      updatedAt: new Date(),
    } as Partial<typeof competitions.$inferInsert>;
    const [c] = await db.update(competitions).set(updateValues).where(eq(competitions.id, String(req.params.id))).returning();
    if (!c) throw new HttpError(404, "not_found");
    res.json({ competition: c });
  } catch (e) {
    next(e);
  }
});

export default router;
