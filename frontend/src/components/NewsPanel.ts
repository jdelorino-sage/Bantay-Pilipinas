import type { ApiClient } from "../services/api-client";
import type { NewsArticle } from "@bantay-pilipinas/shared";
import { escapeHtml } from "../utils/sanitize";

export class NewsPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-news";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">National News</h2>
        <span class="panel-badge">LIVE</span>
      </div>
      <div class="panel-body">
        <p class="panel-placeholder">Loading news feeds...</p>
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
      const response = await this.api.getNews();
      const body = el.querySelector(".panel-body")!;
      const badge = el.querySelector(".panel-badge");
      if (badge) {
        badge.textContent = response.data.length > 0 ? "LIVE" : "EMPTY";
      }
      if (response.data.length === 0) {
        body.innerHTML = '<p class="panel-placeholder">No articles yet</p>';
        return;
      }
      body.innerHTML = response.data
        .slice(0, 20)
        .map(
          (a: NewsArticle) => `
          <div class="news-item">
            <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>
            <span class="news-source">${escapeHtml(a.source)}</span>
          </div>
        `
        )
        .join("");
    } catch (err) {
      console.warn("[news] Failed to load:", err);
      const body = el.querySelector(".panel-body");
      if (body) body.innerHTML = '<p class="panel-placeholder">Waiting for backend...</p>';
    }
  }
}
