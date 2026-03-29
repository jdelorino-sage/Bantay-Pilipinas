import type { ApiClient } from "../services/api-client";
import type { NewsArticle } from "@bantay-pilipinas/shared";
import { escapeHtml, sanitizeUrl } from "../utils/sanitize";

const REGION_FILTERS = [
  { id: "", label: "All" },
  { id: "manila", label: "Manila" },
  { id: "cebu", label: "Cebu" },
  { id: "davao", label: "Davao" },
  { id: "iloilo", label: "Iloilo" },
  { id: "zamboanga", label: "Zambo" },
  { id: "cdo", label: "CDO" },
  { id: "baguio", label: "Baguio" },
  { id: "tacloban", label: "Tacloban" },
  { id: "legazpi", label: "Bicol" },
  { id: "palawan", label: "Palawan" },
  { id: "pampanga", label: "Pampanga" },
  { id: "cotabato", label: "Cotabato" },
  { id: "batangas", label: "Batangas" },
  { id: "laguna", label: "Laguna" },
  { id: "cavite", label: "Cavite" },
  { id: "tuguegarao", label: "Cagayan" },
  { id: "dumaguete", label: "Dumaguete" },
  { id: "pangasinan", label: "Pangasinan" },
  { id: "gensan", label: "GenSan" },
  { id: "butuan", label: "Butuan" },
];

export class NewsPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;
  private activeRegion = "";

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-news";

    const filterBtns = REGION_FILTERS.map(
      (r) => `<button class="region-filter-btn${r.id === this.activeRegion ? " active" : ""}" data-region="${r.id}">${r.label}</button>`
    ).join("");

    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">National & Local News</h2>
        <span class="panel-badge">LIVE</span>
      </div>
      <div class="region-filters">${filterBtns}</div>
      <div class="panel-body">
        <p class="panel-placeholder">Loading news feeds...</p>
      </div>
    `;
    this.el = el;

    el.querySelectorAll<HTMLButtonElement>(".region-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.activeRegion = btn.dataset.region || "";
        el.querySelectorAll(".region-filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.load(el);
      });
    });

    this.load(el);
    return el;
  }

  refresh(): void {
    if (this.el) this.load(this.el);
  }

  private async load(el: HTMLElement): Promise<void> {
    try {
      const response = this.activeRegion
        ? await this.api.getNews(undefined, this.activeRegion)
        : await this.api.getNews();

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
        .slice(0, 25)
        .map(
          (a: NewsArticle) => {
            const regionTag = a.regionId
              ? `<span class="news-region">${escapeHtml(a.regionId.toUpperCase())}</span>`
              : "";
            return `<div class="news-item">
              <a href="${sanitizeUrl(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>
              <span class="news-source">${escapeHtml(a.source)}${regionTag}</span>
            </div>`;
          }
        )
        .join("");
    } catch (err) {
      console.warn("[news] Failed to load:", err);
      const body = el.querySelector(".panel-body");
      if (body) body.innerHTML = '<p class="panel-placeholder">Waiting for backend...</p>';
    }
  }
}
