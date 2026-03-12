import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "@bantay-pilipinas/shared";
import { testConnection, hasDatabaseUrl } from "../db/client.js";
import { getScraperStatuses } from "../scrapers/scheduler.js";

const startTime = Date.now();

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/api/health", async () => {
    try {
      const dbConnected = hasDatabaseUrl() ? await testConnection() : false;
      const statuses = getScraperStatuses();

      const scrapers: Record<string, { status: string; lastRun: string | null }> = {};
      for (const [name, s] of Object.entries(statuses)) {
        scrapers[name] = { status: s.status, lastRun: s.lastRun };
      }

      const response: HealthResponse = {
        status: dbConnected ? "ok" : "degraded",
        database: dbConnected ? "connected" : "disconnected",
        scrapers,
        uptime: Math.floor((Date.now() - startTime) / 1000),
      };
      return response;
    } catch (err) {
      console.error("[health] Handler error:", (err as Error).message);
      return { status: "error", database: "unknown", scrapers: {}, uptime: Math.floor((Date.now() - startTime) / 1000) };
    }
  });
}
