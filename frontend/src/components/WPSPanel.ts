import type { ApiClient } from "../services/api-client";

export class WPSPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-wps";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">West Philippine Sea</h2>
        <span class="panel-badge wps">WPS</span>
      </div>
      <div class="panel-body">
        <div class="tension-score">
          <span class="score-label">Tension Score</span>
          <span class="score-value" id="wps-tension-value">--</span>
        </div>
        <div class="vessel-summary" id="wps-vessel-summary">
          <p class="panel-placeholder">Loading vessel data...</p>
        </div>
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
      const [tension, vessels] = await Promise.all([
        this.api.getWPSTension(),
        this.api.getWPSVessels(),
      ]);
      const scoreEl = el.querySelector("#wps-tension-value");
      if (scoreEl) {
        scoreEl.textContent = tension.data.score.toFixed(1);
        scoreEl.className = `score-value level-${tension.data.level}`;
      }
      const vesselEl = el.querySelector("#wps-vessel-summary");
      if (vesselEl) {
        if (vessels.data.length === 0) {
          vesselEl.innerHTML = '<p class="panel-placeholder">No vessels tracked</p>';
        } else {
          vesselEl.innerHTML = vessels.data
            .map(
              (v) => `
              <div class="disaster-item">
                ${v.name || "Unknown"} (${v.classification.toUpperCase()}) — ${v.nearFeature || "Open sea"}
              </div>
            `
            )
            .join("");
        }
      }
    } catch (err) {
      console.warn("[wps] Failed to load:", err);
    }
  }
}
