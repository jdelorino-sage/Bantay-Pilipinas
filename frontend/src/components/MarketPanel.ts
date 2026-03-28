import type { ApiClient } from "../services/api-client";
import type { EconomicDataPoint } from "@bantay-pilipinas/shared";
import { escapeHtml } from "../utils/sanitize";
import { fetchPSEStocks, type PhisixStock } from "../services/api-client";
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
        <span class="panel-badge live">LIVE</span>
      </div>
      <div class="panel-body">
        <div id="pse-stocks">
          <p class="panel-placeholder">Loading PSE stocks...</p>
        </div>
        <div id="market-indicators">
          <p class="panel-placeholder">Loading economic data...</p>
        </div>
        <div class="fuel-section">
          <div class="fuel-header">
            <span class="fuel-title">FUEL PRICES (per liter) - DOE ${FUEL_PRICES[0]?.asOf || ""}</span>
          </div>
          <div id="fuel-prices">${this.renderFuelPrices()}</div>
        </div>
      </div>
    `;
    this.el = el;
    this.load(el);
    this.loadStocks(el);
    return el;
  }

  refresh(): void {
    if (this.el) {
      this.load(this.el);
      this.loadStocks(this.el);
    }
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

  private async loadStocks(el: HTMLElement): Promise<void> {
    const container = el.querySelector("#pse-stocks")!;
    try {
      const stocks = await fetchPSEStocks();
      if (stocks.length === 0) {
        container.innerHTML = '<p class="panel-placeholder">PSE data unavailable</p>';
        return;
      }

      // Find PSEi (the index) and top movers
      const sorted = [...stocks].sort((a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change));
      const topMovers = sorted.slice(0, 8);

      let html = '<div class="pse-header"><span class="pse-label">PSE STOCKS (Live)</span></div>';
      html += topMovers.map((s: PhisixStock) => {
        const isUp = s.percent_change >= 0;
        const changeClass = isUp ? "stock-up" : "stock-down";
        const arrow = isUp ? "\u25B2" : "\u25BC";
        return `<div class="stock-item">
          <span class="stock-symbol">${escapeHtml(s.symbol)}</span>
          <span class="stock-price">\u20B1${s.price.amount.toFixed(2)}</span>
          <span class="stock-change ${changeClass}">${arrow} ${Math.abs(s.percent_change).toFixed(2)}%</span>
        </div>`;
      }).join("");

      container.innerHTML = html;
    } catch {
      container.innerHTML = '<p class="panel-placeholder">PSE data unavailable</p>';
    }
  }

  private async load(el: HTMLElement): Promise<void> {
    try {
      const response = await this.api.getMarket();
      const container = el.querySelector("#market-indicators")!;
      if (response.data.length === 0) {
        container.innerHTML = "";
        return;
      }
      container.innerHTML = response.data
        .slice(0, 6)
        .map(
          (d: EconomicDataPoint) => `
          <div class="market-item">
            <span class="market-label">${escapeHtml(d.indicator)}</span>
            <span class="market-value">${d.currency === "PHP" ? "\u20B1" : "$"}${d.value.toLocaleString()}</span>
          </div>
        `
        )
        .join("");
    } catch {
      const container = el.querySelector("#market-indicators");
      if (container) container.innerHTML = "";
    }
  }
}
