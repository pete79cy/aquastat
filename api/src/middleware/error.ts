import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../lib/logger.js";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: "validation_error", details: z.treeifyError(err) });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  logger.error({ err }, "unhandled_error");
  res.status(500).json({ error: "internal_error" });
}
