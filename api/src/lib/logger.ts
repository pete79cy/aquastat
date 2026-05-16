import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "aquastat-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ["req.headers.authorization", "req.headers.cookie", "passwordHash", "password"],
});
