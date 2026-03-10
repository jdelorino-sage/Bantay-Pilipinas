import type { ApiClient } from "../services/api-client";
import { escapeHtml } from "../utils/sanitize";

const TICKER_REFRESH_MS = 60_000;
const SCROLL_SPEED_PER_ITEM = 3;

export class NewsTicker {
  private api: ApiClient;
  private contentEl: HTMLElement | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("div");
    el.className = "news-ticker";
    el.innerHTML = `
      <span class="ticker-label">BREAKING</span>
      <div class="ticker-track">
        <div class="ticker-content" id="ticker-content"></div>
      </div>
    `;
    this.contentEl = el.querySelector("#ticker-content");
    this.loadHeadlines();
    this.intervalId = setInterval(() => this.loadHeadlines(), TICKER_REFRESH_MS);
    return el;
  }

  private async loadHeadlines(): Promise<void> {
    if (!this.contentEl) return;
    try {
      const response = await this.api.getNews();
      const articles = response.data;
      if (articles.length === 0) {
        this.contentEl.innerHTML = `<span class="ticker-item">Awaiting headlines...</span>`;
        return;
      }

      const headlines = articles.slice(0, 15);
      const items = headlines
        .map((a) => `<span class="ticker-item">${escapeHtml(a.title)}</span>`)
        .join('<span class="ticker-separator">&bull;</span>');

      this.contentEl.innerHTML = items + '<span class="ticker-separator">&bull;</span>' + items;
      const duration = Math.max(30, headlines.length * SCROLL_SPEED_PER_ITEM);
      this.contentEl.style.setProperty("--ticker-duration", `${duration}s`);
      this.contentEl.style.animationDuration = `${duration}s`;
    } catch {
      if (this.contentEl) {
        this.contentEl.innerHTML = `<span class="ticker-item">Connecting to news feeds...</span>`;
      }
    }
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
