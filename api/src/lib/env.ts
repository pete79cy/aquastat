import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGINS: z.string().default(""),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  // AI extraction
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-4-6"),
  // Per-task overrides. Defaults split by complexity:
  //   - proclamation: long Greek text + reasoning about categories/standards → Opus
  //   - results: tabular structured extraction → Haiku (15x cheaper, 5x faster)
  ANTHROPIC_MODEL_PROCLAMATION: z.string().optional(),
  ANTHROPIC_MODEL_RESULTS: z.string().default("claude-haiku-4-5"),
  // Uploads
  UPLOAD_DIR: z.string().default("/data/uploads"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().default(26214400),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] invalid configuration:", z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [];
