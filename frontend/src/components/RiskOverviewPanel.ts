import type { ApiClient } from "../services/api-client";
import { getStabilityLevel } from "@bantay-pilipinas/shared";

const REGION_WEIGHTS: Record<string, number> = {
  ncr: 0.25,
  barmm: 0.2,
  wps: 0.25,
  car: 0.15,
  "ev-bicol": 0.15,
};

export class RiskOverviewPanel {
  private api: ApiClient;
  private bodyEl: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel risk-overview-panel";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">STRATEGIC RISK OVERVIEW</h2>
        <span class="panel-badge live">LIVE</span>
      </div>
      <div class="panel-body risk-overview-body" id="risk-overview-body">
        <div class="risk-overview">
          <div class="risk-score-big level-guarded">--</div>
          <div class="risk-level-label">LOADING</div>
          <div class="risk-trend trend-stable">-- Stable</div>
        </div>
      </div>
    `;
    this.bodyEl = el.querySelector("#risk-overview-body");
    this.load();
    return el;
  }

  private async load(): Promise<void> {
    if (!this.bodyEl) return;

    try {
      const res = await this.api.getRiskScores();
      const regions = res.data.regions;

      if (regions.length === 0) {
        this.renderScore(25, "stable");
        return;
      }

      let weighted = 0;
      let totalWeight = 0;
      for (const r of regions) {
        const w = REGION_WEIGHTS[r.regionId] ?? 0.1;
        weighted += r.score * w;
        totalWeight += w;
      }
      const overallScore = totalWeight > 0 ? Math.round(weighted / totalWeight) : 25;

      const trends = regions.map((r) => r.trend);
      const risingCount = trends.filter((t) => t === "rising").length;
      const fallingCount = trends.filter((t) => t === "falling").length;
      const overallTrend = risingCount > fallingCount ? "rising" : fallingCount > risingCount ? "falling" : "stable";

      this.renderScore(overallScore, overallTrend);
    } catch {
      this.renderScore(25, "stable");
    }
  }

  private renderScore(score: number, trend: string): void {
    if (!this.bodyEl) return;

    const level = getStabilityLevel(score);
    const levelLabels: Record<string, string> = {
      low: "LOW",
      guarded: "GUARDED",
      elevated: "ELEVATED",
      high: "HIGH",
      severe: "SEVERE",
    };
    const trendSymbol = trend === "rising" ? "\u2191" : trend === "falling" ? "\u2193" : "\u2194";
    const trendLabel = trend.charAt(0).toUpperCase() + trend.slice(1);

    this.bodyEl.innerHTML = `
      <div class="risk-overview">
        <div class="risk-score-big level-${level}">${score}</div>
        <div class="risk-level-label level-${level}">${levelLabels[level] || "MODERATE"}</div>
        <div class="risk-trend-row">
          <span class="risk-trend-label">TREND</span>
          <span class="risk-trend trend-${trend}">${trendSymbol} ${trendLabel}</span>
        </div>
      </div>
    `;
  }

  refresh(): void {
    this.load();
  }
}
