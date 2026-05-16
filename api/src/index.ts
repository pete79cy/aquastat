import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env, corsOrigins } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error.js";
import authRouter from "./routes/auth.js";
import clubsRouter from "./routes/clubs.js";
import athletesRouter from "./routes/athletes.js";
import competitionsRouter from "./routes/competitions.js";
import resultsRouter from "./routes/results.js";
import standardsRouter from "./routes/standards.js";
import swimEventsRouter from "./routes/swimEvents.js";
import seasonsRouter from "./routes/seasons.js";
import statsRouter from "./routes/stats.js";
import aiExtractionsRouter from "./routes/aiExtractions.js";
import documentsRouter from "./routes/documents.js";
import { sql } from "./db/client.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);
app.use(pinoHttp({ logger }));

app.get("/healthz", async (_req, res) => {
  try {
    await sql`SELECT 1`;
    res.status(200).json({ status: "ok", time: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "healthcheck_db_failed");
    res.status(503).json({ status: "degraded", error: "db_unavailable" });
  }
});

app.get("/", (_req, res) => res.json({ name: "Aquastat API", version: "0.1.0" }));

app.use("/api/auth", authRouter);
app.use("/api/clubs", clubsRouter);
app.use("/api/athletes", athletesRouter);
app.use("/api/competitions", competitionsRouter);
app.use("/api/results", resultsRouter);
app.use("/api/standards", standardsRouter);
app.use("/api/swim-events", swimEventsRouter);
app.use("/api/seasons", seasonsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/ai-extractions", aiExtractionsRouter);
app.use("/api/documents", documentsRouter);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "aquastat_api_listening");
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "shutdown_initiated");
  server.close(() => logger.info("http_server_closed"));
  await sql.end({ timeout: 5 });
  logger.info("db_pool_closed");
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
