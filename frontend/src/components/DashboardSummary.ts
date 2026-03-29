import type { ApiClient } from "../services/api-client";
import { escapeHtml } from "../utils/sanitize";

const URGENCY_KEYWORDS_HIGH = ["killed", "dead", "explosion", "shooting", "earthquake", "typhoon signal", "evacuation", "critical", "terrorist", "bomb", "hostage", "tsunami", "eruption", "war", "assault"];
const URGENCY_KEYWORDS_MED = ["arrested", "fire", "flood", "crash", "collision", "protest", "rally", "missing", "landslide", "drug bust", "stabbing", "robbery", "kidnap"];

function getUrgency(title: string): "high" | "medium" | "normal" {
  const lower = title.toLowerCase();
  for (const kw of URGENCY_KEYWORDS_HIGH) {
    if (lower.includes(kw)) return "high";
  }
  for (const kw of URGENCY_KEYWORDS_MED) {
    if (lower.includes(kw)) return "medium";
  }
  return "normal";
}

export class DashboardSummary {
  private api: ApiClient;
  private el: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-dashboard-summary";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">SITUATION SUMMARY</h2>
        <span class="panel-badge live">LIVE</span>
      </div>
      <div class="panel-body" id="dash-summary-body">
        <p class="panel-placeholder">Aggregating signals...</p>
      </div>
    `;
    this.el = el;
    this.load();
    return el;
  }

  refresh(): void {
    this.load();
  }

  private async load(): Promise<void> {
    if (!this.el) return;
    const body = this.el.querySelector("#dash-summary-body")!;

    try {
      const [newsRes, riskRes, disasterRes] = await Promise.allSettled([
        this.api.getNews(),
        this.api.getRiskScores(),
        this.api.getDisaster(),
      ]);

      const articles = newsRes.status === "fulfilled" ? newsRes.value.data : [];
      const risk = riskRes.status === "fulfilled" ? riskRes.value.data : null;
      const disaster = disasterRes.status === "fulfilled" ? disasterRes.value.data : null;

      // Count articles by urgency
      let highCount = 0;
      let medCount = 0;
      const topHighAlert: string[] = [];
      for (const a of articles) {
        const u = getUrgency(a.title);
        if (u === "high") { highCount++; if (topHighAlert.length < 3) topHighAlert.push(a.title); }
        if (u === "medium") medCount++;
      }

      // Find highest risk region
      const regions = risk?.regions || [];
      const sorted = [...regions].sort((a, b) => b.score - a.score);
      const topRegion = sorted[0];

      // Count active disasters
      const eqCount = disaster?.earthquakes?.length || 0;
      const typhoonCount = disaster?.typhoons?.filter((t: { isActive: boolean }) => t.isActive)?.length || 0;
      const advisoryCount = disaster?.weatherAdvisories?.filter((a: { isActive: boolean }) => a.isActive)?.length || 0;

      // Region article counts
      const regionCounts = new Map<string, number>();
      for (const a of articles) {
        if (a.regionId) {
          regionCounts.set(a.regionId, (regionCounts.get(a.regionId) || 0) + 1);
        }
      }
      const topCities = [...regionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

      // WPS tension
      const wpsTension = risk?.wpsTension;

      let html = `<div class="dash-grid">`;

      // Article count
      html += `<div class="dash-stat">
        <span class="dash-stat-value">${articles.length}</span>
        <span class="dash-stat-label">Articles (30s)</span>
      </div>`;

      // High alerts
      html += `<div class="dash-stat ${highCount > 0 ? "dash-alert" : ""}">
        <span class="dash-stat-value">${highCount}</span>
        <span class="dash-stat-label">Critical Alerts</span>
      </div>`;

      // Earthquakes
      html += `<div class="dash-stat">
        <span class="dash-stat-value">${eqCount}</span>
        <span class="dash-stat-label">Earthquakes</span>
      </div>`;

      // Active typhoons
      html += `<div class="dash-stat ${typhoonCount > 0 ? "dash-alert" : ""}">
        <span class="dash-stat-value">${typhoonCount}</span>
        <span class="dash-stat-label">Typhoons</span>
      </div>`;

      // Weather advisories
      html += `<div class="dash-stat">
        <span class="dash-stat-value">${advisoryCount}</span>
        <span class="dash-stat-label">Advisories</span>
      </div>`;

      // WPS Tension
      html += `<div class="dash-stat">
        <span class="dash-stat-value">${wpsTension ? wpsTension.score.toFixed(1) : "--"}</span>
        <span class="dash-stat-label">WPS Tension</span>
      </div>`;

      html += `</div>`;

      // Top risk region
      if (topRegion) {
        html += `<div class="dash-risk">
          <span class="dash-risk-label">Highest Risk:</span>
          <span class="dash-risk-region level-${topRegion.level}">${topRegion.regionId.toUpperCase()} ${topRegion.score.toFixed(1)}</span>
          <span class="dash-risk-trend trend-${topRegion.trend}">${topRegion.trend}</span>
        </div>`;
      }

      // Trending cities
      if (topCities.length > 0) {
        html += `<div class="dash-trending">`;
        for (const [city, count] of topCities) {
          html += `<span class="dash-city-tag">${escapeHtml(city.toUpperCase())} <strong>${count}</strong></span>`;
        }
        html += `</div>`;
      }

      // Critical alerts
      if (topHighAlert.length > 0) {
        html += `<div class="dash-alerts">`;
        for (const title of topHighAlert) {
          html += `<div class="dash-alert-item">${escapeHtml(title.length > 80 ? title.slice(0, 77) + "..." : title)}</div>`;
        }
        html += `</div>`;
      }

      body.innerHTML = html;
    } catch {
      body.innerHTML = '<p class="panel-placeholder">Aggregating signals...</p>';
    }
  }
}

export { getUrgency };
