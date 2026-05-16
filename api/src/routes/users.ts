import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, clubs, auditLogs } from "../db/schema.js";
import { requireAuth, requireRole, tenantClubFilter } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { hashPassword } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

/** Generate a strong human-readable temporary password (16 chars, mixed case + digits + symbols). */
function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!#$%&*";
  const bytes = crypto.randomBytes(16);
  let pw = "";
  for (let i = 0; i < 16; i++) {
    pw += alphabet[bytes[i] % alphabet.length];
  }
  return pw;
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  role: z.enum(["federation_admin", "club_admin", "coach", "parent"]),
  clubId: z.uuid().optional(),
  preferredLocale: z.enum(["el", "en"]).default("el"),
  password: z.string().min(10).optional(),
});

/**
 * Create a user (federation_admin or club_admin).
 * - federation_admin can create any role in any club
 * - club_admin can only create coach/parent in their own club
 * - If `password` is not provided, a strong random one is generated server-side.
 * - The plaintext password is returned exactly once and never stored anywhere
 *   except as a bcrypt hash on the user row.
 */
router.post("/", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const u = req.user!;
    const payload = createSchema.parse(req.body);
    const { isFederationAdmin, clubId: callerClubId } = tenantClubFilter(req);

    // RBAC tenant rules
    if (!isFederationAdmin) {
      // club_admin restrictions
      if (payload.role === "federation_admin" || payload.role === "club_admin") {
        throw new HttpError(403, "club_admin_cannot_create_admin");
      }
      if (!callerClubId) throw new HttpError(403, "no_club_context");
      if (payload.clubId && payload.clubId !== callerClubId) {
        throw new HttpError(403, "wrong_club_scope");
      }
      // Force club to caller's club
      payload.clubId = callerClubId;
    } else {
      // federation_admin: clubId required unless role is federation_admin
      if (payload.role !== "federation_admin" && !payload.clubId) {
        throw new HttpError(400, "club_id_required_for_non_federation_role");
      }
    }

    // Verify club exists if provided
    if (payload.clubId) {
      const [club] = await db.select().from(clubs).where(eq(clubs.id, payload.clubId)).limit(1);
      if (!club) throw new HttpError(404, "club_not_found");
    }

    // Check email uniqueness
    const email = payload.email.toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw new HttpError(409, "email_already_exists");

    // Generate temp password if not supplied
    const wasGenerated = !payload.password;
    const plainPassword = payload.password ?? generateTempPassword();
    const passwordHash = await hashPassword(plainPassword);

    const [created] = await db
      .insert(users)
      .values({
        name: payload.name,
        email,
        passwordHash,
        role: payload.role,
        clubId: payload.role === "federation_admin" ? null : (payload.clubId ?? null),
        preferredLocale: payload.preferredLocale,
        isActive: true,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: u.sub,
      action: "user.created",
      entityType: "user",
      entityId: created.id,
      newValueJson: { role: created.role, clubId: created.clubId, email: created.email },
      ip: req.ip ?? null,
    });

    res.status(201).json({
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        clubId: created.clubId,
        preferredLocale: created.preferredLocale,
        isActive: created.isActive,
      },
      // Plaintext password returned ONCE. Caller should hand it to the user
      // out-of-band. We never log this and it's not stored anywhere else.
      tempPassword: wasGenerated ? plainPassword : null,
    });
  } catch (e) {
    next(e);
  }
});

/** List users (federation_admin or club_admin own club). */
router.get("/", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    const rows = isFederationAdmin
      ? await db.select().from(users)
      : clubId
        ? await db.select().from(users).where(eq(users.clubId, clubId))
        : [];
    // Strip password hashes
    res.json({
      users: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        clubId: r.clubId,
        preferredLocale: r.preferredLocale,
        isActive: r.isActive,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/** Deactivate/reactivate a user. */
router.patch("/:id/active", requireRole("federation_admin", "club_admin"), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const active = Boolean(req.body?.isActive);
    const { isFederationAdmin, clubId } = tenantClubFilter(req);
    const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target) throw new HttpError(404, "not_found");
    if (!isFederationAdmin && target.clubId !== clubId) throw new HttpError(403, "forbidden");

    const [updated] = await db
      .update(users)
      .set({ isActive: active, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: req.user!.sub,
      action: active ? "user.activated" : "user.deactivated",
      entityType: "user",
      entityId: id,
      ip: req.ip ?? null,
    });

    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
      },
    });
  } catch (e) {
    next(e);
  }
});

// Suppress unused-import warning for `and`; kept available for future filters
void and;

export default router;
