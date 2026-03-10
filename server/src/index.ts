import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import { registerNewsRoutes } from "./routes/news.js";
import { registerWPSRoutes } from "./routes/wps.js";
import { registerDisasterRoutes } from "./routes/disaster.js";
import { registerMarketRoutes } from "./routes/market.js";
import { registerMilitaryRoutes } from "./routes/military.js";
import { registerRiskScoreRoutes } from "./routes/risk-scores.js";
import { registerSummarizeRoutes } from "./routes/summarize.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerSocialFeedRoutes } from "./routes/social-feeds.js";
import { startScheduler } from "./scrapers/scheduler.js";
import { registerRealtimeWS } from "./ws/realtime.js";
import { AISStreamClient } from "./services/ais-websocket.js";
import { runMigrations } from "./db/migrate.js";

const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function main(): Promise<void> {
  const app = Fastify({ logger: true });

  // Auto-run database migrations on startup
  try {
    await runMigrations();
  } catch (err) {
    app.log.warn(`Database migration failed (server will continue with in-memory fallback): ${err}`);
  }

  const staticOrigins = [FRONTEND_URL, "https://bantay-pilipinas.netlify.app"];
  if (process.env.NODE_ENV !== "production") {
    staticOrigins.push("http://localhost:5173");
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (staticOrigins.includes(origin)) return cb(null, true);
      if (origin.endsWith(".netlify.app") || origin.endsWith(".netlify.live")) return cb(null, true);
      cb(null, false);
    },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(websocket);

  registerNewsRoutes(app);
  registerWPSRoutes(app);
  registerDisasterRoutes(app);
  registerMarketRoutes(app);
  registerMilitaryRoutes(app);
  registerRiskScoreRoutes(app);
  registerSummarizeRoutes(app);
  registerHealthRoutes(app);
  registerSocialFeedRoutes(app);

  registerRealtimeWS(app);

  const aisClient = new AISStreamClient();
  aisClient.connect();

  startScheduler();

  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`Bantay Pilipinas API listening on port ${PORT}`);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down...`);
    aisClient.disconnect();
    await app.close();
    try {
      const { getPool } = await import("./db/client.js");
      await getPool().end();
    } catch {
      // Pool may not be initialized
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
