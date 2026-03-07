import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "@bantay-pilipinas/shared";
import { testConnection } from "../db/client.js";

const startTime = Date.now();

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/api/health", async () => {
    const dbConnected = await testConnection();
    const response: HealthResponse = {
      status: dbConnected ? "ok" : "degraded",
      database: dbConnected ? "connected" : "disconnected",
      scrapers: {
        rss: { status: "idle", lastRun: null },
        pagasa: { status: "idle", lastRun: null },
        phivolcs: { status: "idle", lastRun: null },
        bsp: { status: "idle", lastRun: null },
        acled: { status: "idle", lastRun: null },
      },
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
    return response;
  });
}
