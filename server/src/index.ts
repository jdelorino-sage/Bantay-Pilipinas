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
import { startScheduler } from "./scrapers/scheduler.js";
import { registerRealtimeWS } from "./ws/realtime.js";

const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function main(): Promise<void> {
  const app = Fastify({ logger: true });

  const origins = [FRONTEND_URL];
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:5173");
  }

  await app.register(cors, {
    origin: origins,
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

  registerRealtimeWS(app);

  startScheduler();

  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`Bantay Pilipinas API listening on port ${PORT}`);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down...`);
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
