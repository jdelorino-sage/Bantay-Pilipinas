import { escapeHtml, sanitizeUrl } from "../utils/sanitize";
import type { NewsArticle } from "@bantay-pilipinas/shared";
import type { ApiClient } from "../services/api-client";
import { getUrgency } from "./DashboardSummary";

export class ArticleModal {
  private el: HTMLElement;
  private api: ApiClient;
  constructor(api: ApiClient) {
    this.api = api;
    this.el = document.createElement("div");
    this.el.className = "article-modal hidden";
    this.el.innerHTML = `
      <div class="article-backdrop"></div>
      <div class="article-slideout">
        <div class="article-slideout-header">
          <span class="article-slideout-title">Article</span>
          <button class="article-slideout-close">&times;</button>
        </div>
        <div class="article-slideout-body" id="article-slideout-body"></div>
      </div>
    `;

    this.el.querySelector(".article-backdrop")?.addEventListener("click", () => this.close());
    this.el.querySelector(".article-slideout-close")?.addEventListener("click", () => this.close());
  }

  render(): HTMLElement {
    return this.el;
  }

  close(): void {
    this.el.classList.add("hidden");
  }

  openArticle(title: string, url: string, source: string, regionId?: string): void {
    this.el.classList.remove("hidden");

    const body = this.el.querySelector("#article-slideout-body")!;
    const urgency = getUrgency(title);
    const urgencyBadge = urgency === "high"
      ? '<span class="article-urgency urgency-high">CRITICAL</span>'
      : urgency === "medium"
        ? '<span class="article-urgency urgency-med">ALERT</span>'
        : "";

    const regionTag = regionId
      ? `<span class="article-region-tag">${escapeHtml(regionId.toUpperCase())}</span>`
      : "";

    const safeUrl = sanitizeUrl(url);

    body.innerHTML = `
      <div class="article-detail-header">
        ${urgencyBadge}${regionTag}
        <h3 class="article-detail-title">${escapeHtml(title)}</h3>
        <div class="article-detail-meta">
          <span class="article-detail-source">${escapeHtml(source)}</span>
          <span class="article-detail-time">${new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" })} PHT</span>
        </div>
      </div>
      <div class="article-iframe-container">
        <iframe
          src="${safeUrl}"
          class="article-iframe"
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerpolicy="no-referrer"
        ></iframe>
        <div class="article-iframe-fallback hidden" id="article-iframe-fallback">
          <p>This article cannot be embedded.</p>
          <a href="${safeUrl}" target="_blank" rel="noopener" class="article-open-btn">Open Full Article \u2197</a>
        </div>
      </div>
      <div class="article-actions">
        <a href="${safeUrl}" target="_blank" rel="noopener" class="article-open-btn">Open in New Tab \u2197</a>
      </div>
      <div class="article-related" id="article-related">
        <span class="article-related-title">Related Signals</span>
        <div class="article-related-list" id="article-related-list">Loading...</div>
      </div>
    `;

    // Monitor iframe load — show fallback if blocked (X-Frame-Options)
    const iframe = body.querySelector<HTMLIFrameElement>(".article-iframe");
    const fallback = body.querySelector<HTMLElement>("#article-iframe-fallback");
    if (iframe && fallback) {
      const timer = setTimeout(() => {
        // If iframe hasn't loaded content in 5 seconds, show fallback
        iframe.classList.add("hidden");
        fallback.classList.remove("hidden");
      }, 5000);
      iframe.addEventListener("load", () => clearTimeout(timer), { once: true });
    }

    // Load related articles
    this.loadRelated(regionId, title);
  }

  private async loadRelated(regionId?: string, currentTitle?: string): Promise<void> {
    const list = this.el.querySelector("#article-related-list");
    if (!list) return;

    try {
      const res = regionId
        ? await this.api.getNews(undefined, regionId)
        : await this.api.getNews();

      const related = res.data
        .filter((a: NewsArticle) => a.title !== currentTitle)
        .slice(0, 5);

      if (related.length === 0) {
        list.innerHTML = '<span class="article-related-empty">No related signals</span>';
        return;
      }

      list.innerHTML = related.map((a: NewsArticle) => {
        const u = getUrgency(a.title);
        const cls = u === "high" ? " related-urgent" : "";
        const tag = a.regionId ? `<span class="article-region-tag-sm">${a.regionId.toUpperCase()}</span>` : "";
        return `<div class="article-related-item${cls}" data-url="${escapeHtml(a.url)}" data-title="${escapeHtml(a.title)}" data-source="${escapeHtml(a.source)}" data-region="${a.regionId || ""}">
          ${tag}<span class="related-title">${escapeHtml(a.title)}</span>
          <span class="related-source">${escapeHtml(a.source)}</span>
        </div>`;
      }).join("");

      // Make related items clickable
      list.querySelectorAll<HTMLElement>(".article-related-item").forEach((item) => {
        item.addEventListener("click", () => {
          const url = item.dataset.url || "";
          const title = item.dataset.title || "";
          const source = item.dataset.source || "";
          const region = item.dataset.region || undefined;
          this.openArticle(title, url, source, region);
        });
      });
    } catch {
      list.innerHTML = '<span class="article-related-empty">Unable to load</span>';
    }
  }
}
