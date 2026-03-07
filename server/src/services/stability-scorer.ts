import { REGION_BASELINES, RegionId, getStabilityLevel } from "@bantay-pilipinas/shared";
import type { RegionalStabilityScore } from "@bantay-pilipinas/shared";

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

export function computeAllRegions(): RegionalStabilityScore[] {
  // TODO: Fetch real input data from database
  return Object.values(RegionId).map((regionId) =>
    computeRegionalStability(regionId, 20, 20, 20)
  );
}
