import type { ApiClient } from "../services/api-client";
import { escapeHtml, sanitizeUrl } from "../utils/sanitize";
import { WPS_FEATURES, EDCA_SITES } from "../config/geo";
import { PH_ENTITIES } from "../config/entities";

export class SearchModal {
  private api: ApiClient;
  private el: HTMLElement | null = null;
  private isOpen = false;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("div");
    el.className = "search-modal hidden";
    el.innerHTML = `
      <div class="search-backdrop"></div>
      <div class="search-dialog">
        <input type="text" class="search-input" placeholder="Search news, entities, locations..." autofocus />
        <div class="search-results" id="search-results"></div>
        <div class="search-hint">ESC to close &middot; Cmd+K to toggle</div>
      </div>
    `;
    this.el = el;

    el.querySelector(".search-backdrop")?.addEventListener("click", () => this.close());

    const input = el.querySelector<HTMLInputElement>(".search-input");
    if (input) {
      let debounce: ReturnType<typeof setTimeout>;
      input.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => this.search(input.value.trim()), 250);
      });
    }

    return el;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (!this.el) return;
    this.isOpen = true;
    this.el.classList.remove("hidden");
    const input = this.el.querySelector<HTMLInputElement>(".search-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    const results = this.el.querySelector("#search-results");
    if (results) results.innerHTML = "";
  }

  close(): void {
    if (!this.el) return;
    this.isOpen = false;
    this.el.classList.add("hidden");
  }

  private async search(query: string): Promise<void> {
    const results = this.el?.querySelector("#search-results");
    if (!results) return;

    if (!query) {
      results.innerHTML = "";
      return;
    }

    const q = query.toLowerCase();
    let html = "";

    const matchedEntities = PH_ENTITIES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.aliases.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 5);

    if (matchedEntities.length > 0) {
      html += '<div class="search-group"><span class="search-group-label">Entities</span>';
      for (const e of matchedEntities) {
        html += `<div class="search-result-item">${escapeHtml(e.name)} <span class="search-meta">${escapeHtml(e.category)}</span></div>`;
      }
      html += "</div>";
    }

    const matchedWPS = WPS_FEATURES.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.filipinoName.toLowerCase().includes(q)
    );
    const matchedBases = EDCA_SITES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q)
    );

    if (matchedWPS.length > 0 || matchedBases.length > 0) {
      html += '<div class="search-group"><span class="search-group-label">Locations</span>';
      for (const f of matchedWPS) {
        html += `<div class="search-result-item">${escapeHtml(f.name)} <span class="search-meta">${escapeHtml(f.filipinoName)}</span></div>`;
      }
      for (const s of matchedBases) {
        html += `<div class="search-result-item">${escapeHtml(s.name)} <span class="search-meta">${escapeHtml(s.location)}</span></div>`;
      }
      html += "</div>";
    }

    try {
      const newsRes = await this.api.getNews();
      const matchedNews = newsRes.data
        .filter((a) => a.title.toLowerCase().includes(q))
        .slice(0, 8);

      if (matchedNews.length > 0) {
        html += '<div class="search-group"><span class="search-group-label">News</span>';
        for (const a of matchedNews) {
          html += `<div class="search-result-item">
            <a href="${sanitizeUrl(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>
            <span class="search-meta">${escapeHtml(a.source)}</span>
          </div>`;
        }
        html += "</div>";
      }
    } catch {
      // skip news results on error
    }

    if (!html) {
      html = '<div class="search-empty">No results found</div>';
    }

    results.innerHTML = html;
  }
}
