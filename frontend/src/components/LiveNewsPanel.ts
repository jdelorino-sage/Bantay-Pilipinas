import { escapeHtml } from "../utils/sanitize";
import type { ApiClient } from "../services/api-client";
import type { AISummary, FocalPoint } from "@bantay-pilipinas/shared";

export class LiveNewsPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;
  private newsCount = 0;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel live-news-panel";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI INTELLIGENCE BRIEF</h2>
        <span class="panel-badge live" id="news-count-badge">${this.newsCount}</span>
      </div>
      <div class="ai-brief-body" id="ai-brief-body">
        <div class="ai-brief-loading">
          <span class="brief-dot"></span> Analyzing signals...
        </div>
      </div>
      <div class="radar-overlay" id="radar-overlay">
        <span class="radar-label">ON OUR RADAR</span>
        <span class="radar-text" id="radar-text">Loading...</span>
      </div>
    `;
    this.el = el;
    this.loadBrief();
    this.loadRadar();
    return el;
  }

  refresh(): void {
    this.loadRadar();
  }

  private async loadBrief(): Promise<void> {
    if (!this.el) return;
    const body = this.el.querySelector("#ai-brief-body") as HTMLElement;

    try {
      // Get news articles first
      const newsRes = await this.api.getNews();
      const articles = newsRes.data;
      this.newsCount = articles.length;

      const badge = this.el.querySelector("#news-count-badge");
      if (badge) badge.textContent = String(this.newsCount);

      if (articles.length === 0) {
        body.innerHTML = `<div class="ai-brief-content"><p class="panel-placeholder">Waiting for news signals...</p></div>`;
        return;
      }

      // Request AI summary from backend
      const headlineIds = articles.slice(0, 20).map((a) => a.id);
      const summaryRes = await this.api.getSummary(headlineIds);
      this.renderBrief(body, summaryRes.data);
    } catch {
      body.innerHTML = `
        <div class="ai-brief-content">
          <p class="ai-brief-fallback">AI briefing requires backend connection. Set ANTHROPIC_API_KEY in Railway for Claude Sonnet 4.6 powered intelligence summaries.</p>
        </div>
      `;
    }
  }

  private renderBrief(body: HTMLElement, summary: AISummary): void {
    const providerLabel = summary.provider === "none" ? "" : `<span class="ai-provider">${escapeHtml(summary.provider.toUpperCase())}</span>`;
    const timestamp = new Date(summary.createdAt).toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" });

    const paragraphs = summary.summaryText
      .split("\n\n")
      .filter((p) => p.trim())
      .map((p) => `<p class="ai-brief-para">${escapeHtml(p.trim())}</p>`)
      .join("");

    let focalHtml = "";
    if (summary.focalPoints.length > 0) {
      const items = summary.focalPoints
        .map((fp: FocalPoint) => {
          const severityClass = `focal-${fp.severity}`;
          return `<span class="focal-tag ${severityClass}">${escapeHtml(fp.title)}</span>`;
        })
        .join("");
      focalHtml = `<div class="focal-tags">${items}</div>`;
    }

    body.innerHTML = `
      <div class="ai-brief-content">
        <div class="ai-brief-meta">
          ${providerLabel}
          <span class="ai-brief-time">${escapeHtml(timestamp)} PHT</span>
        </div>
        ${paragraphs}
        ${focalHtml}
      </div>
    `;
  }

  private async loadRadar(): Promise<void> {
    try {
      const res = await this.api.getNews();
      const articles = res.data;
      this.newsCount = articles.length;

      const badge = this.el?.querySelector("#news-count-badge");
      if (badge) badge.textContent = String(this.newsCount);

      const radarText = this.el?.querySelector("#radar-text");
      if (radarText && articles.length > 0) {
        const top = articles[0];
        radarText.innerHTML = escapeHtml(top.title);
      }
    } catch {
      // silently fail
    }
  }
}
