import type { ApiClient } from "../services/api-client";
import type { AISummary } from "@bantay-pilipinas/shared";
import { escapeHtml } from "../utils/sanitize";

const REFRESH_INTERVAL = 60_000;

export class InsightsPanel {
  private api: ApiClient;
  private bodyEl: HTMLElement | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-insights";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI INSIGHTS</h2>
        <span class="panel-badge live">LIVE</span>
      </div>
      <div class="panel-body insights-body">
        <div class="insights-brief-label">
          <span class="brief-dot"></span> PH BRIEF
        </div>
        <p class="panel-placeholder">Loading AI briefing...</p>
      </div>
    `;
    this.bodyEl = el.querySelector(".insights-body");

    this.fetchAndRender();
    this.intervalId = setInterval(() => this.fetchAndRender(), REFRESH_INTERVAL);

    return el;
  }

  private async fetchAndRender(): Promise<void> {
    if (!this.bodyEl) return;

    try {
      const newsRes = await this.api.getNews();
      const articles = newsRes.data;
      if (!articles || articles.length === 0) {
        this.bodyEl.innerHTML = `
          <div class="insights-brief-label"><span class="brief-dot"></span> PH BRIEF</div>
          <p class="panel-placeholder">No headlines available for AI analysis.</p>
        `;
        return;
      }

      const headlineIds = articles.slice(0, 20).map((a) => a.id);
      const summaryRes = await this.api.getSummary(headlineIds);
      this.renderSummary(summaryRes.data);
    } catch {
      this.bodyEl.innerHTML = `
        <div class="insights-brief-label"><span class="brief-dot"></span> PH BRIEF</div>
        <p class="panel-placeholder">AI briefing will appear when backend is connected.</p>
      `;
    }
  }

  private renderSummary(summary: AISummary): void {
    if (!this.bodyEl) return;

    const providerLabel = summary.provider === "none" ? "No AI provider" : escapeHtml(summary.provider);
    const timestamp = new Date(summary.createdAt).toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" });

    const paragraphs = summary.summaryText
      .split("\n\n")
      .filter((p) => p.trim())
      .map((p) => `<p class="insights-text">${escapeHtml(p.trim())}</p>`)
      .join("");

    let focalHtml = "";
    if (summary.focalPoints.length > 0) {
      const items = summary.focalPoints
        .map((fp) => {
          const severityClass = `focal-${fp.severity}`;
          return `<li class="focal-item ${severityClass}">
            <span class="focal-severity">${escapeHtml(fp.severity.toUpperCase())}</span>
            <span class="focal-title">${escapeHtml(fp.title)}</span>
          </li>`;
        })
        .join("");
      focalHtml = `<ul class="focal-list">${items}</ul>`;
    }

    this.bodyEl.innerHTML = `
      <div class="insights-brief-label"><span class="brief-dot"></span> PH BRIEF</div>
      <div class="insights-content">
        ${paragraphs}
        ${focalHtml}
        <div class="insights-meta">
          <span class="insights-provider">${providerLabel}</span>
          <span class="insights-time">${escapeHtml(timestamp)} PHT</span>
        </div>
      </div>
    `;
  }

  refresh(): void {
    this.fetchAndRender();
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
