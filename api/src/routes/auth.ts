import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, passwordResetTokens, auditLogs } from "../db/schema.js";
import { hashPassword, verifyPassword, signJwt } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";

const router = Router();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    if (!user || !user.isActive) throw new HttpError(401, "invalid_credentials");
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new HttpError(401, "invalid_credentials");

    const token = signJwt({
      sub: user.id,
      role: user.role,
      clubId: user.clubId,
      email: user.email,
    });

    // Set httpOnly cookie for browser clients
    res.cookie("aquastat_token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600 * 1000,
      path: "/",
    });

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "auth.login",
      ip: req.ip ?? null,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubId: user.clubId,
        preferredLocale: user.preferredLocale,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("aquastat_token", { path: "/" });
  res.status(204).end();
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.sub)).limit(1);
    if (!user) throw new HttpError(404, "user_not_found");
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
      preferredLocale: user.preferredLocale,
      isActive: user.isActive,
    });
  } catch (e) {
    next(e);
  }
});

const forgotSchema = z.object({ email: z.email() });

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    // Always 204 to prevent user enumeration (PDR v1.1 §D.2)
    if (user) {
      const raw = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      // TODO: send via SMTP. For MVP, log the link.
      const link = `https://aquastat.pakkou.cloud/reset-password?token=${raw}`;
      logger.info({ userId: user.id, link }, "password_reset_requested");

      await db.insert(auditLogs).values({
        userId: user.id,
        action: "auth.forgot_password.requested",
        ip: req.ip ?? null,
      });
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

const resetSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(10, "Password must be at least 10 characters"),
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = resetSchema.parse(req.body);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new HttpError(400, "invalid_or_expired_token");
    }

    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));

    await db.insert(auditLogs).values({
      userId: record.userId,
      action: "auth.password_reset.completed",
      ip: req.ip ?? null,
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
