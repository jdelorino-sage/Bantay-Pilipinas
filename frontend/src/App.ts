import { ApiClient } from "./services/api-client";
import { MapContainer } from "./components/MapContainer";
import { MapLegend } from "./components/MapLegend";
import { LayerPanel } from "./components/LayerPanel";
import { NewsTicker } from "./components/NewsTicker";
import { LiveNewsPanel } from "./components/LiveNewsPanel";
import { NewsPanel } from "./components/NewsPanel";
import { WPSPanel } from "./components/WPSPanel";
import { DisasterPanel } from "./components/DisasterPanel";
import { MarketPanel } from "./components/MarketPanel";
import { StabilityPanel } from "./components/StabilityPanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { StrategicPosturePanel } from "./components/StrategicPosturePanel";
import { RiskOverviewPanel } from "./components/RiskOverviewPanel";

interface RefreshablePanel {
  render(): HTMLElement;
  refresh(): void;
}

const POLL_INTERVAL_MS = 60_000;

export class App {
  private container: HTMLElement;
  private api: ApiClient;
  private panelInstances: RefreshablePanel[] = [];
  private ticker: NewsTicker | null = null;
  private consecutiveHealthFailures = 0;
  constructor(container: HTMLElement) {
    this.container = container;
    this.api = new ApiClient();
  }

  async init(): Promise<void> {
    this.container.innerHTML = "";
    this.renderLayout();
    this.initTicker();
    this.initLayerPanel();
    this.initMap();
    this.initRightPanels();
    this.startClock();
    this.registerKeyboardShortcuts();
    this.startPolling();
  }

  private renderLayout(): void {
    const layout = document.createElement("div");
    layout.className = "app-layout";
    layout.innerHTML = `
      <header class="app-header">
        <div class="header-left">
          <span class="variant-badge">PHILIPPINE</span>
          <h1 class="app-title">BANTAY PILIPINAS</h1>
          <span class="header-version">v0.1.0</span>
        </div>
        <div class="header-center">
          <span class="status-indicator live" id="connection-status">
            <span class="status-dot"></span> LIVE
          </span>
          <span class="alert-level" id="alert-level">
            <span class="alert-label">ALERT</span>
            <span class="alert-value" id="alert-value">1</span>
          </span>
        </div>
        <div class="header-right">
          <span class="header-notification" id="header-notif-count">0</span>
          <button class="header-btn" id="btn-search" title="Search (Cmd+K)">Search</button>
          <button class="header-btn" id="btn-settings" title="Settings">\u2699</button>
        </div>
      </header>
      <div class="situation-bar">
        <span class="situation-label">PHILIPPINE SITUATION</span>
        <span class="situation-datetime" id="situation-datetime"></span>
        <div class="situation-controls">
          <button class="view-toggle active" id="btn-2d">2D</button>
          <button class="view-toggle" id="btn-3d">3D</button>
        </div>
      </div>
      <main class="app-main">
        <div id="layer-sidebar-container"></div>
        <div class="map-area">
          <div class="map-wrapper" id="map-container"></div>
          <div id="map-legend-container"></div>
        </div>
        <div class="right-panels" id="right-panels"></div>
      </main>
      <div id="ticker-container"></div>
    `;
    this.container.appendChild(layout);
  }

  private initLayerPanel(): void {
    const container = document.getElementById("layer-sidebar-container");
    if (!container) return;
    const layerPanel = new LayerPanel();
    container.appendChild(layerPanel.render());
  }

  private initTicker(): void {
    const tickerContainer = document.getElementById("ticker-container");
    if (!tickerContainer) return;
    this.ticker = new NewsTicker(this.api);
    tickerContainer.appendChild(this.ticker.render());
  }

  private initMap(): void {
    const mapEl = document.getElementById("map-container");
    if (mapEl) {
      new MapContainer(mapEl);
    }

    const legendContainer = document.getElementById("map-legend-container");
    if (legendContainer) {
      const legend = new MapLegend();
      legendContainer.appendChild(legend.render());
    }
  }

  private initRightPanels(): void {
    const rightPanels = document.getElementById("right-panels");
    if (!rightPanels) return;

    const liveNews = new LiveNewsPanel(this.api);
    const insightsPanel = new InsightsPanel(this.api);
    const posturePanel = new StrategicPosturePanel(this.api);
    const riskPanel = new RiskOverviewPanel(this.api);
    const stabilityPanel = new StabilityPanel(this.api);
    const newsPanel = new NewsPanel(this.api);
    const wpsPanel = new WPSPanel(this.api);
    const disasterPanel = new DisasterPanel(this.api);
    const marketPanel = new MarketPanel(this.api);

    rightPanels.appendChild(liveNews.render());

    const scrollArea = document.createElement("div");
    scrollArea.className = "right-panels-scroll";

    scrollArea.appendChild(insightsPanel.render());

    const splitRow = document.createElement("div");
    splitRow.className = "panel-split-row";
    splitRow.appendChild(posturePanel.render());
    splitRow.appendChild(riskPanel.render());
    scrollArea.appendChild(splitRow);

    scrollArea.appendChild(stabilityPanel.render());
    scrollArea.appendChild(newsPanel.render());
    scrollArea.appendChild(wpsPanel.render());
    scrollArea.appendChild(disasterPanel.render());
    scrollArea.appendChild(marketPanel.render());

    rightPanels.appendChild(scrollArea);

    this.panelInstances = [
      liveNews,
      insightsPanel,
      posturePanel,
      riskPanel,
      stabilityPanel,
      newsPanel,
      wpsPanel,
      disasterPanel,
      marketPanel,
    ];
  }

  private startClock(): void {
    const update = () => {
      const el = document.getElementById("situation-datetime");
      if (!el) return;
      const now = new Date();
      const formatted = now.toLocaleDateString("en-PH", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Manila",
      }).toUpperCase() + " " + now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Manila",
      }) + " PHT";
      el.textContent = formatted;
    };
    update();
    setInterval(update, 1000);
  }

  private registerKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
    });
  }

  private startPolling(): void {
    this.checkHealth();
    setInterval(() => {
      for (const panel of this.panelInstances) {
        panel.refresh();
      }
      this.checkHealth();
    }, POLL_INTERVAL_MS);
  }

  private async checkHealth(): Promise<void> {
    const statusEl = document.getElementById("connection-status");
    if (!statusEl) return;
    try {
      await this.api.getHealth();
      this.consecutiveHealthFailures = 0;
      statusEl.innerHTML = '<span class="status-dot"></span> LIVE';
      statusEl.className = "status-indicator live";
      statusEl.style.color = "";
      statusEl.style.borderColor = "";
    } catch {
      this.consecutiveHealthFailures++;
      if (this.consecutiveHealthFailures >= 2) {
        statusEl.innerHTML = "OFFLINE";
        statusEl.className = "status-indicator";
        statusEl.style.color = "var(--accent-red, #ef5350)";
        statusEl.style.borderColor = "var(--accent-red, #ef5350)";
      }
    }
  }
}
