import type { ApiClient } from "../services/api-client";
import type { EconomicDataPoint } from "@bantay-pilipinas/shared";
import { escapeHtml } from "../utils/sanitize";
import { FUEL_PRICES } from "../config/energy";

export class MarketPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-market";
    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">Economic Pulse</h2>
      </div>
      <div class="panel-body">
        <div id="market-indicators">
          <p class="panel-placeholder">Loading economic data...</p>
        </div>
        <div class="fuel-section">
          <div class="fuel-header">
            <span class="fuel-title">FUEL PRICES (per liter)</span>
          </div>
          <div id="fuel-prices">${this.renderFuelPrices()}</div>
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

  private renderFuelPrices(): string {
    return FUEL_PRICES.slice(0, 8)
      .map(
        (fp) => `
        <div class="fuel-item">
          <span class="fuel-city">${escapeHtml(fp.city)}</span>
          <span class="fuel-gas">\u26FD \u20B1${fp.gasoline.low.toFixed(0)}-${fp.gasoline.high.toFixed(0)}</span>
          <span class="fuel-diesel">\u{1F6E2} \u20B1${fp.diesel.low.toFixed(0)}-${fp.diesel.high.toFixed(0)}</span>
        </div>
      `
      )
      .join("");
  }

  private async load(el: HTMLElement): Promise<void> {
    try {
      const response = await this.api.getMarket();
      const container = el.querySelector("#market-indicators")!;
      if (response.data.length === 0) {
        container.innerHTML = '<p class="panel-placeholder">No data available</p>';
        return;
      }
      container.innerHTML = response.data
        .slice(0, 10)
        .map(
          (d: EconomicDataPoint) => `
          <div class="market-item">
            <span class="market-label">${escapeHtml(d.indicator)}</span>
            <span class="market-value">${d.currency === "PHP" ? "\u20B1" : "$"}${d.value.toLocaleString()}</span>
          </div>
        `
        )
        .join("");
    } catch (err) {
      console.warn("[market] Failed to load:", err);
      const container = el.querySelector("#market-indicators");
      if (container) container.innerHTML = '<p class="panel-placeholder">Waiting for backend...</p>';
    }
  }
}
