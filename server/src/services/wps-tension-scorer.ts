import { getStabilityLevel } from "@bantay-pilipinas/shared";
import type { WPSTensionScore } from "@bantay-pilipinas/shared";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";

async function getWPSTrend(currentScore: number): Promise<"rising" | "falling" | "stable"> {
  if (!hasDatabaseUrl()) return "stable";
  try {
    const result = await query(
      `SELECT score FROM ${TABLES.WPS_TENSION_SCORES}
       ORDER BY computed_at DESC LIMIT 1`,
    );
    if (result.rows.length === 0) return "stable";
    const prev = parseFloat(result.rows[0].score);
    const diff = currentScore - prev;
    if (diff > 3) return "rising";
    if (diff < -3) return "falling";
    return "stable";
  } catch {
    return "stable";
  }
}

export async function computeWPSTension(
  vesselIntrusions: number,
  diplomaticSignals: number,
  militaryActivity: number,
  newsVelocity: number
): Promise<WPSTensionScore> {
  const score =
    vesselIntrusions * 0.35 +
    diplomaticSignals * 0.25 +
    militaryActivity * 0.25 +
    newsVelocity * 0.15;

  const trend = await getWPSTrend(score);

  return {
    score,
    components: { vesselIntrusions, diplomaticSignals, militaryActivity, newsVelocity },
    level: getStabilityLevel(score),
    trend,
    computedAt: new Date().toISOString(),
  };
}
