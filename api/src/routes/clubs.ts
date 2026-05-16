import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clubs } from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    const list = isFederationAdmin
      ? await db.select().from(clubs).orderBy(clubs.name)
      : clubId
        ? await db.select().from(clubs).where(eq(clubs.id, clubId))
        : [];
    res.json({ clubs: list });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    if (!isFederationAdmin && clubId !== String(req.params.id)) throw new HttpError(404, "not_found");
    const [club] = await db.select().from(clubs).where(eq(clubs.id, String(req.params.id))).limit(1);
    if (!club) throw new HttpError(404, "not_found");
    res.json({ club });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  shortName: z.string().optional(),
  federationCode: z.string().optional(),
  country: z.string().default("CY"),
});

router.post("/", requireRole("federation_admin"), async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const [club] = await db.insert(clubs).values(payload).returning();
    res.status(201).json({ club });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    if (!isFederationAdmin && clubId !== String(req.params.id)) throw new HttpError(403, "forbidden");
    const payload = createSchema.partial().parse(req.body);
    const [club] = await db
      .update(clubs)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(clubs.id, String(req.params.id)))
      .returning();
    res.json({ club });
  } catch (e) {
    next(e);
  }
});

export default router;
