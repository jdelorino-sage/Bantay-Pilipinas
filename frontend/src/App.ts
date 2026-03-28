import { ApiClient } from "./services/api-client";
import { AISWebSocket } from "./services/websocket";
import { MapContainer } from "./components/MapContainer";
import { MapLegend } from "./components/MapLegend";
import { LayerPanel } from "./components/LayerPanel";
import { NewsTicker } from "./components/NewsTicker";
import { LiveNewsPanel } from "./components/LiveNewsPanel";
import { NewsPanel } from "./components/NewsPanel";
import { WPSPanel } from "./components/WPSPanel";
import { DisasterPanel } from "./components/DisasterPanel";
import { MarketPanel } from "./components/MarketPanel";
import { MilitaryPanel } from "./components/MilitaryPanel";
import { StabilityPanel } from "./components/StabilityPanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { StrategicPosturePanel } from "./components/StrategicPosturePanel";
import { RiskOverviewPanel } from "./components/RiskOverviewPanel";
import { OFWPanel } from "./components/OFWPanel";
import { InfrastructurePanel } from "./components/InfrastructurePanel";
import { SearchModal } from "./components/SearchModal";
import { GlobeMap } from "./components/GlobeMap";
import { SettingsPanel } from "./components/SettingsPanel";
import { t, toggleLocale } from "./i18n";
import { withErrorBoundary } from "./utils/error-boundary";
import type { TrackedVessel, StabilityLevel } from "@bantay-pilipinas/shared";

interface RefreshablePanel {
  render(): HTMLElement;
  refresh(): void;
}

const POLL_INTERVAL_MS = 60_000;

export class App {
  private container: HTMLElement;
  private api: ApiClient;
  private aisSocket: AISWebSocket;
  private panelInstances: RefreshablePanel[] = [];
  private ticker: NewsTicker | null = null;
  private searchModal: SearchModal | null = null;
  private settingsPanel: SettingsPanel | null = null;
  private globeMap: GlobeMap | null = null;
  private mapContainer: MapContainer | null = null;
  private is3D = false;
  private consecutiveHealthFailures = 0;
  private lastNewsCount = 0;
  private vesselBuffer: TrackedVessel[] = [];
  constructor(container: HTMLElement) {
    this.container = container;
    this.api = new ApiClient();
    this.aisSocket = new AISWebSocket();
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
    this.initWebSocket();
    this.initSearchModal();
    this.initSettingsPanel();
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
          <button class="header-btn" id="btn-search" title="Search (Cmd+K)">${t("search")}</button>
          <button class="header-btn header-lang-btn" id="btn-lang" title="Toggle language">${t("langToggle")}</button>
          <button class="header-btn" id="btn-settings" title="Settings">\u2699</button>
        </div>
      </header>
      <div class="situation-bar">
        <span class="situation-label" id="situation-label">${t("situation")}</span>
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
      this.mapContainer = new MapContainer(mapEl);
    }

    const legendContainer = document.getElementById("map-legend-container");
    if (legendContainer) {
      const legend = new MapLegend();
      legendContainer.appendChild(legend.render());
    }

    document.getElementById("btn-2d")?.addEventListener("click", () => this.setMapMode(false));
    document.getElementById("btn-3d")?.addEventListener("click", () => this.setMapMode(true));
  }

  private setMapMode(use3D: boolean): void {
    if (this.is3D === use3D) return;
    this.is3D = use3D;

    document.getElementById("btn-2d")?.classList.toggle("active", !use3D);
    document.getElementById("btn-3d")?.classList.toggle("active", use3D);

    const mapEl = document.getElementById("map-container");
    if (!mapEl) return;

    if (use3D) {
      this.mapContainer = null;
      mapEl.innerHTML = "";
      this.globeMap = new GlobeMap(mapEl);
      this.globeMap.init();
    } else {
      this.globeMap = null;
      mapEl.innerHTML = "";
      this.mapContainer = new MapContainer(mapEl);
    }
  }

  getMapContainer(): MapContainer | null {
    return this.mapContainer;
  }

  private initRightPanels(): void {
    const rightPanels = document.getElementById("right-panels");
    if (!rightPanels) return;

    const liveNews = withErrorBoundary(new LiveNewsPanel(this.api), "Live News");
    const insightsPanel = withErrorBoundary(new InsightsPanel(this.api), "AI Insights");
    const posturePanel = withErrorBoundary(new StrategicPosturePanel(this.api), "Strategic Posture");
    const riskPanel = withErrorBoundary(new RiskOverviewPanel(this.api), "Risk Overview");
    const stabilityPanel = withErrorBoundary(new StabilityPanel(this.api), "Regional Instability");
    const newsPanel = withErrorBoundary(new NewsPanel(this.api), "National News");
    const wpsPanel = withErrorBoundary(new WPSPanel(this.api), "West Philippine Sea");
    const militaryPanel = withErrorBoundary(new MilitaryPanel(this.api), "Military Tracker");
    const disasterPanel = withErrorBoundary(new DisasterPanel(this.api), "Disaster Monitor");
    const marketPanel = withErrorBoundary(new MarketPanel(this.api), "Market Data");
    const ofwPanel = withErrorBoundary(new OFWPanel(this.api), "OFW & Diaspora");
    const infraPanel = withErrorBoundary(new InfrastructurePanel(), "Infrastructure");

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
    scrollArea.appendChild(militaryPanel.render());
    scrollArea.appendChild(disasterPanel.render());
    scrollArea.appendChild(marketPanel.render());
    scrollArea.appendChild(ofwPanel.render());
    scrollArea.appendChild(infraPanel.render());

    rightPanels.appendChild(scrollArea);

    this.panelInstances = [
      liveNews,
      insightsPanel,
      posturePanel,
      riskPanel,
      stabilityPanel,
      newsPanel,
      wpsPanel,
      militaryPanel,
      disasterPanel,
      marketPanel,
      ofwPanel,
      infraPanel,
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
        this.searchModal?.toggle();
      }
      if (e.key === "Escape") {
        this.searchModal?.close();
        this.settingsPanel?.close();
      }
    });

    document.getElementById("btn-search")?.addEventListener("click", () => {
      this.searchModal?.toggle();
    });

    document.getElementById("btn-lang")?.addEventListener("click", () => {
      toggleLocale();
    });

    document.getElementById("btn-settings")?.addEventListener("click", () => {
      this.settingsPanel?.toggle();
    });

    document.addEventListener("locale-change", () => {
      const langBtn = document.getElementById("btn-lang");
      if (langBtn) langBtn.textContent = t("langToggle");

      const sitLabel = document.getElementById("situation-label");
      if (sitLabel) sitLabel.textContent = t("situation");

      for (const panel of this.panelInstances) {
        panel.refresh();
      }
    });
  }

  private initWebSocket(): void {
    this.aisSocket.connect();
    this.aisSocket.onVesselUpdate((vessel) => {
      this.vesselBuffer = this.vesselBuffer.filter(
        (v) => v.mmsi !== vessel.mmsi
      );
      this.vesselBuffer.push(vessel);
      if (this.vesselBuffer.length > 500) {
        this.vesselBuffer = this.vesselBuffer.slice(-500);
      }
      document.dispatchEvent(
        new CustomEvent("ais-vessel-update", { detail: vessel })
      );
    });
  }

  private initSearchModal(): void {
    this.searchModal = new SearchModal(this.api);
    document.body.appendChild(this.searchModal.render());
  }

  private initSettingsPanel(): void {
    this.settingsPanel = new SettingsPanel();
    document.body.appendChild(this.settingsPanel.render());
  }

  private startPolling(): void {
    this.checkHealth();
    this.updateAlertLevel();
    setInterval(() => {
      for (const panel of this.panelInstances) {
        panel.refresh();
      }
      this.checkHealth();
      this.updateAlertLevel();
    }, POLL_INTERVAL_MS);
  }

  private async updateAlertLevel(): Promise<void> {
    try {
      const [riskRes, newsRes] = await Promise.all([
        this.api.getRiskScores(),
        this.api.getNews(),
      ]);

      const levelMap: Record<StabilityLevel, number> = {
        low: 1, guarded: 2, elevated: 3, high: 4, severe: 5,
      };
      const regions = riskRes.data.regions;
      let maxLevel = 1;
      for (const r of regions) {
        const lv = levelMap[r.level as StabilityLevel] || 1;
        if (lv > maxLevel) maxLevel = lv;
      }
      const wpsLv = levelMap[riskRes.data.wpsTension.level as StabilityLevel] || 1;
      if (wpsLv > maxLevel) maxLevel = wpsLv;

      const alertEl = document.getElementById("alert-value");
      if (alertEl) alertEl.textContent = String(maxLevel);

      const newCount = newsRes.data.length;
      const diff = Math.max(0, newCount - this.lastNewsCount);
      this.lastNewsCount = newCount;

      const notifEl = document.getElementById("header-notif-count");
      if (notifEl && diff > 0) {
        const current = parseInt(notifEl.textContent || "0", 10);
        notifEl.textContent = String(current + diff);
      }
    } catch {
      // non-critical
    }
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
