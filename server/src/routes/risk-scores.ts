import type { FastifyInstance } from "fastify";
import type { ApiResponse, RegionalStabilityScore, WPSTensionScore } from "@bantay-pilipinas/shared";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";
import { computeAllRegions } from "../services/stability-scorer.js";
import { computeWPSTension } from "../services/wps-tension-scorer.js";
import { LRUCache } from "../services/cache.js";

const cache = new LRUCache<unknown>(20);
const SCORE_TTL = 60_000;

async function getLatestRegionScores(): Promise<RegionalStabilityScore[]> {
  const cached = cache.get("risk:regions") as RegionalStabilityScore[] | undefined;
  if (cached) return cached;

  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT DISTINCT ON (region_id)
                region_id AS "regionId", score, components, boosts, level, trend,
                computed_at AS "computedAt"
         FROM ${TABLES.STABILITY_SCORES}
         ORDER BY region_id, computed_at DESC`
      );
      if (result.rows.length > 0) {
        const scores = result.rows.map((r: Record<string, unknown>) => ({
          ...r,
          components: typeof r.components === "string" ? JSON.parse(r.components as string) : r.components,
          boosts: typeof r.boosts === "string" ? JSON.parse(r.boosts as string) : (r.boosts || {}),
        })) as RegionalStabilityScore[];
        cache.set("risk:regions", scores, SCORE_TTL);
        return scores;
      }
    } catch (err) {
      console.error("[risk-scores] Failed to query stability scores:", (err as Error).message);
    }
  }

  const scores = await computeAllRegions();
  cache.set("risk:regions", scores, SCORE_TTL);
  return scores;
}

async function getLatestWPSTension(): Promise<WPSTensionScore> {
  const cached = cache.get("risk:wps") as WPSTensionScore | undefined;
  if (cached) return cached;

  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT score, components, level, trend, computed_at AS "computedAt"
         FROM ${TABLES.WPS_TENSION_SCORES}
         ORDER BY computed_at DESC LIMIT 1`
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const tension = {
          ...row,
          components: typeof row.components === "string" ? JSON.parse(row.components) : row.components,
        } as WPSTensionScore;
        cache.set("risk:wps", tension, SCORE_TTL);
        return tension;
      }
    } catch (err) {
      console.error("[risk-scores] Failed to query WPS tension:", (err as Error).message);
    }
  }

  const tension = await computeWPSTension(0, 0, 0, 0);
  cache.set("risk:wps", tension, SCORE_TTL);
  return tension;
}

async function getScoreHistory(): Promise<RegionalStabilityScore[]> {
  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT region_id AS "regionId", score, components, boosts, level, trend,
                computed_at AS "computedAt"
         FROM ${TABLES.STABILITY_SCORES}
         WHERE computed_at > NOW() - INTERVAL '7 days'
         ORDER BY computed_at DESC
         LIMIT 500`
      );
      return result.rows.map((r: Record<string, unknown>) => ({
        ...r,
        components: typeof r.components === "string" ? JSON.parse(r.components as string) : r.components,
        boosts: typeof r.boosts === "string" ? JSON.parse(r.boosts as string) : (r.boosts || {}),
      })) as RegionalStabilityScore[];
    } catch (err) {
      console.error("[risk-scores] Failed to query history:", (err as Error).message);
    }
  }
  return [];
}

export function registerRiskScoreRoutes(app: FastifyInstance): void {
  app.get("/api/risk-scores", async () => {
    try {
      const [regions, wpsTension] = await Promise.all([
        getLatestRegionScores(),
        getLatestWPSTension(),
      ]);
      const response: ApiResponse<{ regions: RegionalStabilityScore[]; wpsTension: WPSTensionScore }> = {
        data: { regions, wpsTension },
        meta: { freshness: "live", timestamp: new Date().toISOString() },
      };
      return response;
    } catch (err) {
      console.error("[risk-scores] Handler error:", (err as Error).message);
      return {
        data: { regions: [], wpsTension: await computeWPSTension(0, 0, 0, 0) },
        meta: { freshness: "error", timestamp: new Date().toISOString() },
      };
    }
  });

  app.get("/api/risk-scores/history", async () => {
    try {
      const history = await getScoreHistory();
      const response: ApiResponse<RegionalStabilityScore[]> = {
        data: history,
        meta: { freshness: history.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
      };
      return response;
    } catch (err) {
      console.error("[risk-scores] History handler error:", (err as Error).message);
      return { data: [], meta: { freshness: "error", timestamp: new Date().toISOString() } };
    }
  });
}
