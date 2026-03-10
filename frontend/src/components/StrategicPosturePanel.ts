import type { ApiClient } from "../services/api-client";
import { escapeHtml } from "../utils/sanitize";

export class StrategicPosturePanel {
  private api: ApiClient;
  private bodyEl: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel posture-panel";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI STRATEGIC POSTURE</h2>
        <span class="panel-badge" id="posture-new-badge">LIVE</span>
      </div>
      <div class="panel-body posture-body" id="posture-body">
        <p class="panel-placeholder">Loading WPS theater data...</p>
      </div>
    `;
    this.bodyEl = el.querySelector("#posture-body");
    this.load();
    return el;
  }

  private async load(): Promise<void> {
    if (!this.bodyEl) return;

    try {
      const [wpsRes, tensionRes] = await Promise.all([
        this.api.getWPSVessels(),
        this.api.getWPSTension(),
      ]);

      const vessels = wpsRes.data;
      const tension = tensionRes.data;

      const ccgCount = vessels.filter((v) => v.classification === "ccg").length;
      const planCount = vessels.filter((v) => v.classification === "plan").length;
      const pafmmCount = vessels.filter((v) => v.classification === "pafmm").length;
      const phNavyCount = vessels.filter((v) => v.classification === "ph-navy").length;
      const usNavyCount = vessels.filter((v) => v.classification === "us-navy").length;
      const foreignSea = ccgCount + planCount + pafmmCount;
      const friendlySea = phNavyCount + usNavyCount;

      const airCount = Math.round(tension.components.militaryActivity);

      const severityMap: Record<string, string> = {
        low: "LOW",
        guarded: "MOD",
        elevated: "ELEVATED",
        high: "HIGH",
        severe: "CRIT",
      };
      const severityLabel = severityMap[tension.level] || "MOD";
      const severityClass = `level-${tension.level}`;

      const trendSymbol = tension.trend === "rising" ? "\u2191" : tension.trend === "falling" ? "\u2193" : "\u2194";
      const trendClass = `trend-${tension.trend}`;

      this.bodyEl.innerHTML = `
        <div class="posture-theater">
          <span class="posture-theater-name">WPS Theater</span>
          <span class="posture-severity ${severityClass}">${escapeHtml(severityLabel)}</span>
        </div>
        <div class="posture-row">
          <span class="posture-domain">AIR</span>
          <span class="posture-icons">\u2708 ${airCount}</span>
        </div>
        <div class="posture-row">
          <span class="posture-domain">SEA</span>
          <span class="posture-icons">
            \u{1F6A9} ${foreignSea} &nbsp; \u2693 ${friendlySea}
          </span>
        </div>
        <div class="posture-trend">
          <span class="${trendClass}">${trendSymbol} ${escapeHtml(tension.trend)}</span>
        </div>
      `;
    } catch {
      if (this.bodyEl) {
        this.bodyEl.innerHTML = `
          <div class="posture-theater">
            <span class="posture-theater-name">WPS Theater</span>
            <span class="posture-severity level-guarded">MOD</span>
          </div>
          <div class="posture-row">
            <span class="posture-domain">AIR</span>
            <span class="posture-icons">\u2708 0</span>
          </div>
          <div class="posture-row">
            <span class="posture-domain">SEA</span>
            <span class="posture-icons">\u{1F6A9} 0 &nbsp; \u2693 0</span>
          </div>
          <div class="posture-trend">
            <span class="trend-stable">\u2194 stable</span>
          </div>
        `;
      }
    }
  }

  refresh(): void {
    this.load();
  }
}
