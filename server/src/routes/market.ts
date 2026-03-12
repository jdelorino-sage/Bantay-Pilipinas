import type { FastifyInstance } from "fastify";
import type { ApiResponse, EconomicDataPoint } from "@bantay-pilipinas/shared";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";
import { LRUCache } from "../services/cache.js";

const cache = new LRUCache<EconomicDataPoint[]>(10);
const CACHE_TTL = 60_000;

async function getMarketData(): Promise<EconomicDataPoint[]> {
  const cached = cache.get("market:latest");
  if (cached) return cached;

  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT DISTINCT ON (indicator)
                id, indicator, value, currency, source, recorded_at AS "recordedAt"
         FROM ${TABLES.ECONOMIC_DATA}
         ORDER BY indicator, recorded_at DESC`
      );
      const data = result.rows as EconomicDataPoint[];
      if (data.length > 0) {
        cache.set("market:latest", data, CACHE_TTL);
        return data;
      }
    } catch (err) {
      console.error("[market] Failed to query economic data:", (err as Error).message);
    }
  }

  return [];
}

export function registerMarketRoutes(app: FastifyInstance): void {
  app.get("/api/market", async () => {
    try {
      const data = await getMarketData();
      const response: ApiResponse<EconomicDataPoint[]> = {
        data,
        meta: { freshness: data.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
      };
      return response;
    } catch (err) {
      console.error("[market] Handler error:", (err as Error).message);
      return { data: [], meta: { freshness: "error", timestamp: new Date().toISOString() } };
    }
  });
}
