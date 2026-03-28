import type { ApiClient } from "../services/api-client";
import { escapeHtml, sanitizeUrl } from "../utils/sanitize";

export class OFWPanel {
  private api: ApiClient;
  private bodyEl: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-ofw";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">OFW &amp; Diaspora</h2>
        <span class="panel-badge ofw">OFW</span>
      </div>
      <div class="panel-body" id="ofw-body">
        <p class="panel-placeholder">Loading OFW data...</p>
      </div>
    `;
    this.bodyEl = el.querySelector("#ofw-body");
    this.load();
    return el;
  }

  refresh(): void {
    this.load();
  }

  private async load(): Promise<void> {
    if (!this.bodyEl) return;
    try {
      const [newsRes, marketRes] = await Promise.all([
        this.api.getNews("ofw-diaspora"),
        this.api.getMarket(),
      ]);

      const articles = newsRes.data.slice(0, 8);
      const remittance = marketRes.data.find((d) => d.indicator === "OFW Remittances");

      let html = "";

      if (remittance) {
        html += `<div class="ofw-remittance">
          <span class="ofw-label">OFW Remittances</span>
          <span class="ofw-value">$${(remittance.value / 1e9).toFixed(2)}B</span>
        </div>`;
      }

      if (articles.length === 0) {
        html += '<p class="panel-placeholder">No OFW news available</p>';
      } else {
        for (const a of articles) {
          const time = a.publishedAt
            ? new Date(a.publishedAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })
            : "";
          html += `<div class="news-item">
            <a href="${sanitizeUrl(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>
            <span class="news-meta">${escapeHtml(a.source)} ${time}</span>
          </div>`;
        }
      }

      this.bodyEl.innerHTML = html;
    } catch {
      if (this.bodyEl) {
        this.bodyEl.innerHTML = '<p class="panel-placeholder">Waiting for backend...</p>';
      }
    }
  }
}
