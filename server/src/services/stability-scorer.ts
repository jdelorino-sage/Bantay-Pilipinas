import { REGION_BASELINES, RegionId, getStabilityLevel } from "@bantay-pilipinas/shared";
import type { RegionalStabilityScore } from "@bantay-pilipinas/shared";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";
import { computeWPSTension } from "./wps-tension-scorer.js";

export function computeRegionalStability(
  regionId: RegionId,
  unrest: number,
  security: number,
  information: number
): RegionalStabilityScore {
  const baseline = REGION_BASELINES[regionId];
  const score = baseline * 0.3 + unrest * 0.25 + security * 0.25 + information * 0.2;

  return {
    regionId,
    score,
    components: { baselineRisk: baseline, unrest, security, information },
    boosts: {},
    level: getStabilityLevel(score),
    trend: "stable",
    computedAt: new Date().toISOString(),
  };
}

async function getNewsVelocityForCategory(category: string, hours = 6): Promise<number> {
  if (!hasDatabaseUrl()) return 20;
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM ${TABLES.NEWS_ARTICLES}
       WHERE category = $1 AND fetched_at > NOW() - INTERVAL '${hours} hours'`,
      [category]
    );
    const count = parseInt(result.rows[0]?.count || "0", 10);
    return Math.min(count * 5, 100);
  } catch {
    return 20;
  }
}

async function getConflictScore(regionKeyword: string): Promise<number> {
  if (!hasDatabaseUrl()) return 20;
  try {
    const result = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(fatalities), 0) as fatalities
       FROM ${TABLES.CONFLICT_EVENTS}
       WHERE location ILIKE $1 AND event_date > NOW() - INTERVAL '30 days'`,
      [`%${regionKeyword}%`]
    );
    const count = parseInt(result.rows[0]?.count || "0", 10);
    const fatalities = parseInt(result.rows[0]?.fatalities || "0", 10);
    return Math.min(count * 3 + fatalities * 10, 100);
  } catch {
    return 20;
  }
}

async function getVesselIntrusionScore(): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  try {
    const result = await query(
      `SELECT COUNT(DISTINCT mmsi) as count FROM ${TABLES.VESSEL_TRACKS}
       WHERE in_eez = true AND recorded_at > NOW() - INTERVAL '24 hours'`
    );
    const count = parseInt(result.rows[0]?.count || "0", 10);
    return Math.min(count * 5, 100);
  } catch {
    return 0;
  }
}

export function computeAllRegions(): RegionalStabilityScore[] {
  return Object.values(RegionId).map((regionId) =>
    computeRegionalStability(regionId, 20, 20, 20)
  );
}

export async function runScoreComputation(): Promise<void> {
  const [ncrUnrest, barmmConflict, wpsVessels, carConflict, disasterNews] = await Promise.all([
    getConflictScore("Metro Manila"),
    getConflictScore("Mindanao"),
    getVesselIntrusionScore(),
    getConflictScore("Cordillera"),
    getNewsVelocityForCategory("disaster"),
  ]);

  const [ncrNews, wpsNews, barmmNews] = await Promise.all([
    getNewsVelocityForCategory("national-politics"),
    getNewsVelocityForCategory("wps-maritime"),
    getNewsVelocityForCategory("defense"),
  ]);

  const regions: RegionalStabilityScore[] = [
    computeRegionalStability(RegionId.NCR, ncrUnrest, 20, ncrNews),
    computeRegionalStability(RegionId.BARMM, barmmConflict, Math.min(barmmConflict + 10, 100), barmmNews),
    computeRegionalStability(RegionId.WPS, 0, wpsVessels, wpsNews),
    computeRegionalStability(RegionId.CAR, carConflict, Math.min(carConflict + 5, 100), 20),
    computeRegionalStability(RegionId.EVBicol, 15, 20, disasterNews),
  ];

  if (hasDatabaseUrl()) {
    for (const r of regions) {
      await query(
        `INSERT INTO ${TABLES.STABILITY_SCORES}
         (region_id, score, components, boosts, level, trend, computed_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [r.regionId, r.score, JSON.stringify(r.components), JSON.stringify(r.boosts), r.level, r.trend]
      ).catch((err: unknown) => console.error("[stability] DB insert failed:", (err as Error).message));
    }

    const wpsTension = computeWPSTension(wpsVessels, wpsNews, 20, wpsNews);
    await query(
      `INSERT INTO ${TABLES.WPS_TENSION_SCORES}
       (score, components, level, trend, computed_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [wpsTension.score, JSON.stringify(wpsTension.components), wpsTension.level, wpsTension.trend]
    ).catch((err: unknown) => console.error("[stability] WPS tension DB insert failed:", (err as Error).message));
  }

  console.log(`[stability] Computed scores for ${regions.length} regions (store: ${hasDatabaseUrl() ? "db" : "memory"})`);
}
