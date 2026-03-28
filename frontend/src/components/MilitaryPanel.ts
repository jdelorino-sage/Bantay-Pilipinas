import type { ApiClient } from "../services/api-client";
import { escapeHtml } from "../utils/sanitize";

interface MilitaryFlight {
  icao24: string;
  callsign: string | null;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  classification: string;
  lastSeen: string;
}

export class MilitaryPanel {
  private api: ApiClient;
  private bodyEl: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-military";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">Military Activity</h2>
        <span class="panel-badge military">MIL</span>
      </div>
      <div class="panel-body" id="military-body">
        <p class="panel-placeholder">Loading military data...</p>
      </div>
    `;
    this.bodyEl = el.querySelector("#military-body");
    this.load();
    return el;
  }

  refresh(): void {
    this.load();
  }

  private async load(): Promise<void> {
    if (!this.bodyEl) return;
    try {
      const res = await this.api.getMilitary();
      const flights = res.data as MilitaryFlight[];

      if (flights.length === 0) {
        this.bodyEl.innerHTML = '<p class="panel-placeholder">No military flights detected</p>';
        return;
      }

      const phMil = flights.filter((f) => f.classification === "ph-military");
      const foreign = flights.filter((f) => f.classification === "military");

      let html = `<div class="military-summary">
        <span class="mil-count">${flights.length} aircraft tracked</span>
      </div>`;

      if (phMil.length > 0) {
        html += `<div class="mil-section"><span class="mil-label">PAF/AFP</span>`;
        for (const f of phMil.slice(0, 5)) {
          const cs = f.callsign ? escapeHtml(f.callsign) : "Unknown";
          const alt = Math.round(f.altitude).toLocaleString();
          html += `<div class="disaster-item">${cs} &mdash; ${alt}ft, hdg ${Math.round(f.heading)}&deg;</div>`;
        }
        html += `</div>`;
      }

      if (foreign.length > 0) {
        html += `<div class="mil-section"><span class="mil-label">Foreign Military</span>`;
        for (const f of foreign.slice(0, 5)) {
          const cs = f.callsign ? escapeHtml(f.callsign) : "Unknown";
          const alt = Math.round(f.altitude).toLocaleString();
          html += `<div class="disaster-item">${cs} &mdash; ${alt}ft, hdg ${Math.round(f.heading)}&deg;</div>`;
        }
        html += `</div>`;
      }

      this.bodyEl.innerHTML = html;
    } catch {
      if (this.bodyEl) {
        this.bodyEl.innerHTML = '<p class="panel-placeholder">Waiting for backend...</p>';
      }
    }
  }
}
