import type { FastifyInstance } from "fastify";
import { RegionId, StabilityLevel } from "@bantay-pilipinas/shared";
import type { ApiResponse, RegionalStabilityScore, WPSTensionScore } from "@bantay-pilipinas/shared";

const MOCK_REGIONS: RegionalStabilityScore[] = [
  {
    regionId: RegionId.NCR,
    score: 22.5,
    components: { baselineRisk: 15, unrest: 25, security: 20, information: 30 },
    boosts: {},
    level: StabilityLevel.Guarded,
    trend: "stable",
    computedAt: new Date().toISOString(),
  },
  {
    regionId: RegionId.BARMM,
    score: 45.0,
    components: { baselineRisk: 40, unrest: 50, security: 48, information: 40 },
    boosts: {},
    level: StabilityLevel.Elevated,
    trend: "stable",
    computedAt: new Date().toISOString(),
  },
  {
    regionId: RegionId.WPS,
    score: 42.5,
    components: { baselineRisk: 35, unrest: 0, security: 55, information: 45 },
    boosts: {},
    level: StabilityLevel.Elevated,
    trend: "rising",
    computedAt: new Date().toISOString(),
  },
  {
    regionId: RegionId.CAR,
    score: 28.0,
    components: { baselineRisk: 25, unrest: 30, security: 28, information: 30 },
    boosts: {},
    level: StabilityLevel.Guarded,
    trend: "falling",
    computedAt: new Date().toISOString(),
  },
  {
    regionId: RegionId.EVBicol,
    score: 25.0,
    components: { baselineRisk: 20, unrest: 15, security: 22, information: 40 },
    boosts: {},
    level: StabilityLevel.Guarded,
    trend: "stable",
    computedAt: new Date().toISOString(),
  },
];

const MOCK_WPS_TENSION: WPSTensionScore = {
  score: 42.5,
  components: { vesselIntrusions: 55, diplomaticSignals: 30, militaryActivity: 45, newsVelocity: 35 },
  level: StabilityLevel.Elevated,
  trend: "stable",
  computedAt: new Date().toISOString(),
};

export function registerRiskScoreRoutes(app: FastifyInstance): void {
  app.get("/api/risk-scores", async () => {
    const response: ApiResponse<{ regions: RegionalStabilityScore[]; wpsTension: WPSTensionScore }> = {
      data: { regions: MOCK_REGIONS, wpsTension: MOCK_WPS_TENSION },
      meta: { freshness: "mock", timestamp: new Date().toISOString() },
    };
    return response;
  });

  app.get("/api/risk-scores/history", async () => {
    const response: ApiResponse<RegionalStabilityScore[]> = {
      data: [],
      meta: { freshness: "mock", timestamp: new Date().toISOString() },
    };
    return response;
  });
}
