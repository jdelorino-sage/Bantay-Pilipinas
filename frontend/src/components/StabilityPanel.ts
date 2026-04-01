import type { ApiClient } from "../services/api-client";
import type { RegionalStabilityScore } from "@bantay-pilipinas/shared";
import { escapeHtml } from "../utils/sanitize";

const REGION_LABELS: Record<string, string> = {
  ncr: "NCR",
  barmm: "BARMM",
  wps: "WPS",
  car: "CAR",
  "ev-bicol": "EV/Bicol",
};

export class StabilityPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-stability";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">REGIONAL INSTABILITY</h2>
      </div>
      <div class="panel-body" id="stability-body">
        <p class="panel-placeholder">Loading regional scores...</p>
      </div>
    `;
    this.el = el;
    this.load(el);
    return el;
  }

  refresh(): void {
    if (this.el) this.load(this.el);
  }

  private async load(el: HTMLElement): Promise<void> {
    try {
      const response = await this.api.getRiskScores();
      const body = el.querySelector("#stability-body")!;
      const regions = response.data.regions;

      if (regions.length === 0) {
        body.innerHTML = '<p class="panel-placeholder">Waiting for backend...</p>';
        return;
      }

      const sorted = [...regions].sort((a, b) => b.score - a.score);
      const top = sorted[0];
      const rest = sorted.slice(1);

      const topLabel = REGION_LABELS[top.regionId] || top.regionId.toUpperCase();
      const topU = top.components.unrest.toFixed(0);
      const topS = top.components.security.toFixed(0);
      const topI = top.components.information.toFixed(0);

      const topHtml = `
        <div class="instability-top">
          <div class="instability-top-row">
            <span class="instability-dot level-${top.level}"></span>
            <span class="instability-name">${escapeHtml(topLabel)}</span>
            <span class="instability-score level-${top.level}">${top.score.toFixed(0)}</span>
            <span class="instability-trend trend-${top.trend}">${top.trend === "rising" ? "\u2191" : top.trend === "falling" ? "\u2193" : "\u2194"}</span>
          </div>
          <div class="instability-breakdown" title="Unrest / Security / Information">
            U:${topU} S:${topS} I:${topI}
          </div>
        </div>
      `;

      const restHtml = rest
        .map((r: RegionalStabilityScore) => {
          const label = REGION_LABELS[r.regionId] || r.regionId.toUpperCase();
          return `
          <div class="stability-region">
            <span class="instability-dot level-${r.level}"></span>
            <span class="region-id">${escapeHtml(label)}</span>
            <span class="region-score level-${r.level}">${r.score.toFixed(1)}</span>
            <span class="region-trend trend-${r.trend}">${r.trend}</span>
          </div>
        `;
        })
        .join("");

      const wpsTension = response.data.wpsTension;
      const wpsHtml = `
        <div class="wps-tension-summary">
          <span>WPS Tension</span>
          <span class="score-value level-${wpsTension.level}">
            ${wpsTension.score.toFixed(1)}
          </span>
        </div>
      `;

      body.innerHTML = `
        ${topHtml}
        ${wpsHtml}
        <div class="stability-regions">${restHtml}</div>
      `;
    } catch (err) {
      console.warn("[stability] Failed to load:", err);
      const body = el.querySelector("#stability-body");
      if (body) body.innerHTML = '<p class="panel-placeholder">Waiting for backend...</p>';
    }
  }
}
