import type { ApiClient } from "../services/api-client";
import type { Typhoon, Earthquake, VolcanoStatus, WeatherAdvisory } from "@bantay-pilipinas/shared";
import { escapeHtml } from "../utils/sanitize";
import { t } from "../i18n";

const ADVISORY_LABELS: Record<string, string> = {
  lpa: "LPA",
  monsoon: "Monsoon",
  itcz: "ITCZ",
  shearline: "Shearline",
  ridge: "Ridge",
  general: "Advisory",
};

const ALERT_LEVEL_CLASSES: Record<number, string> = {
  0: "alert-normal",
  1: "alert-low",
  2: "alert-elevated",
  3: "alert-high",
  4: "alert-severe",
};

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export class DisasterPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-disaster";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">${t("panelDisaster")}</h2>
      </div>
      <div class="panel-body">
        <div class="disaster-section">
          <h3>${t("weatherAdvisory")}</h3>
          <div id="advisory-list"><p class="panel-placeholder">${t("noData")}</p></div>
        </div>
        <div class="disaster-section">
          <h3>${t("typhoonActive")}</h3>
          <div id="typhoon-list"><p class="panel-placeholder">${t("noData")}</p></div>
        </div>
        <div class="disaster-section">
          <h3>${t("earthquakeRecent")}</h3>
          <div id="earthquake-list"><p class="panel-placeholder">${t("loading")}</p></div>
        </div>
        <div class="disaster-section">
          <h3>${t("volcanoStatus")}</h3>
          <div id="volcano-list"><p class="panel-placeholder">${t("loading")}</p></div>
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
      const response = await this.api.getDisaster();
      const { typhoons, earthquakes, volcanoes, weatherAdvisories } = response.data;

      const advisoryList = el.querySelector("#advisory-list")!;
      const activeAdvisories = (weatherAdvisories || []).filter((a: WeatherAdvisory) => a.isActive);
      if (activeAdvisories.length > 0) {
        advisoryList.innerHTML = activeAdvisories
          .map((a: WeatherAdvisory) => {
            const label = ADVISORY_LABELS[a.type] || a.type;
            const areas = a.affectedAreas.length > 0
              ? ` — ${a.affectedAreas.slice(0, 3).map(escapeHtml).join(", ")}`
              : "";
            const time = formatTimeAgo(a.updatedAt);
            return `<div class="disaster-item disaster-advisory"><strong>${escapeHtml(label)}</strong>${areas} <span class="disaster-time">${time}</span><br><small>${escapeHtml(a.description.slice(0, 150))}</small></div>`;
          })
          .join("");
      } else {
        advisoryList.innerHTML = `<p class="panel-placeholder">${t("noData")}</p>`;
      }

      const typhoonList = el.querySelector("#typhoon-list")!;
      if (typhoons.length > 0) {
        typhoonList.innerHTML = typhoons
          .map((ty: Typhoon) => {
            const name = ty.localName
              ? `${escapeHtml(ty.localName)}${ty.internationalName ? ` (${escapeHtml(ty.internationalName)})` : ""}`
              : escapeHtml(ty.internationalName || ty.id);
            const wind = ty.maxWindKph ? `${ty.maxWindKph} kph` : "?";
            const signalCount = Object.keys(ty.signalAreas || {}).length;
            const signalInfo = signalCount > 0 ? ` | ${signalCount} area(s) under signal` : "";
            const time = formatTimeAgo(ty.updatedAt);
            return `<div class="disaster-item disaster-typhoon"><strong>${name}</strong> — ${wind}${signalInfo} <span class="disaster-time">${time}</span></div>`;
          })
          .join("");
      } else {
        typhoonList.innerHTML = `<p class="panel-placeholder">${t("noData")}</p>`;
      }

      const eqList = el.querySelector("#earthquake-list")!;
      if (earthquakes.length > 0) {
        eqList.innerHTML = earthquakes
          .slice(0, 8)
          .map((e: Earthquake) => {
            const magClass = e.magnitude >= 5 ? "eq-strong" : e.magnitude >= 3 ? "eq-moderate" : "eq-light";
            const depth = e.depthKm != null ? `${e.depthKm}km` : "?";
            const tsunami = e.tsunamiAdvisory ? ' <span class="tsunami-badge">TSUNAMI</span>' : "";
            const time = formatTimeAgo(e.occurredAt);
            const source = e.source !== "phivolcs" ? ` [${escapeHtml(e.source.toUpperCase())}]` : "";
            return `<div class="disaster-item ${magClass}"><strong>M${e.magnitude.toFixed(1)}</strong> ${escapeHtml(e.locationText || "Unknown")} <span class="eq-depth">${depth}</span>${tsunami}${source} <span class="disaster-time">${time}</span></div>`;
          })
          .join("");
      } else {
        eqList.innerHTML = `<p class="panel-placeholder">${t("noData")}</p>`;
      }

      const volList = el.querySelector("#volcano-list")!;
      if (volcanoes.length > 0) {
        volList.innerHTML = volcanoes
          .map((v: VolcanoStatus) => {
            const cls = ALERT_LEVEL_CLASSES[v.alertLevel] || "";
            const desc = v.alertDescription ? ` — ${escapeHtml(v.alertDescription)}` : "";
            return `<div class="disaster-item volcano-item ${cls}"><strong>${escapeHtml(v.name)}</strong> Alert ${v.alertLevel}${desc}</div>`;
          })
          .join("");
      } else {
        volList.innerHTML = `<p class="panel-placeholder">${t("noData")}</p>`;
      }
    } catch (err) {
      console.warn("[disaster] Failed to load:", err);
      const eqList = el.querySelector("#earthquake-list");
      if (eqList) eqList.innerHTML = `<p class="panel-placeholder">${t("error")}</p>`;
      const volList = el.querySelector("#volcano-list");
      if (volList) volList.innerHTML = `<p class="panel-placeholder">${t("error")}</p>`;
    }
  }
}
