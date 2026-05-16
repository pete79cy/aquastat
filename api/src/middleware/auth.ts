import type { Request, Response, NextFunction } from "express";
import { verifyJwt, type JwtPayload } from "../lib/auth.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Extracts JWT from cookie or Authorization header. */
function extractToken(req: Request): string | null {
  const auth = req.header("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length);
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.aquastat_token;
  return cookieToken ?? null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    req.user = verifyJwt(token);
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}

type Role = JwtPayload["role"];

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "forbidden", required: roles });
      return;
    }
    next();
  };
}

/** Federation admin sees all clubs; everyone else is scoped to their club. */
export function tenantClubFilter(req: Request): { isFederationAdmin: boolean; clubId: string | null } {
  if (!req.user) return { isFederationAdmin: false, clubId: null };
  return {
    isFederationAdmin: req.user.role === "federation_admin",
    clubId: req.user.clubId,
  };
}
