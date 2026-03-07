import { getStabilityLevel } from "@bantay-pilipinas/shared";
import type { WPSTensionScore } from "@bantay-pilipinas/shared";

export function computeWPSTension(
  vesselIntrusions: number,
  diplomaticSignals: number,
  militaryActivity: number,
  newsVelocity: number
): WPSTensionScore {
  const score =
    vesselIntrusions * 0.35 +
    diplomaticSignals * 0.25 +
    militaryActivity * 0.25 +
    newsVelocity * 0.15;

  return {
    score,
    components: { vesselIntrusions, diplomaticSignals, militaryActivity, newsVelocity },
    level: getStabilityLevel(score),
    trend: "stable",
    computedAt: new Date().toISOString(),
  };
}
