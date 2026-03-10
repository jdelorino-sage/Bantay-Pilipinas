import { ApiClient } from "./services/api-client";
import { MapContainer } from "./components/MapContainer";
import { NewsPanel } from "./components/NewsPanel";
import { WPSPanel } from "./components/WPSPanel";
import { DisasterPanel } from "./components/DisasterPanel";
import { MarketPanel } from "./components/MarketPanel";
import { StabilityPanel } from "./components/StabilityPanel";
import { InsightsPanel } from "./components/InsightsPanel";

interface RefreshablePanel {
  render(): HTMLElement;
  refresh(): void;
}

const POLL_INTERVAL_MS = 60_000;

export class App {
  private container: HTMLElement;
  private api: ApiClient;
  private panelInstances: RefreshablePanel[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.api = new ApiClient();
  }

  async init(): Promise<void> {
    this.container.innerHTML = "";
    this.renderLayout();
    this.initMap();
    this.initPanels();
    this.registerKeyboardShortcuts();
    this.startPolling();
  }

  private renderLayout(): void {
    const layout = document.createElement("div");
    layout.className = "app-layout";
    layout.innerHTML = `
      <header class="app-header">
        <h1 class="app-title">BANTAY PILIPINAS</h1>
        <div class="header-controls">
          <span class="status-indicator" id="connection-status">LIVE</span>
        </div>
      </header>
      <main class="app-main">
        <div class="map-area" id="map-container"></div>
        <aside class="panel-sidebar" id="panel-sidebar"></aside>
      </main>
    `;
    this.container.appendChild(layout);
  }

  private initMap(): void {
    const mapEl = document.getElementById("map-container");
    if (mapEl) {
      new MapContainer(mapEl);
    }
  }

  private initPanels(): void {
    const sidebar = document.getElementById("panel-sidebar");
    if (!sidebar) return;

    const panels: RefreshablePanel[] = [
      new NewsPanel(this.api),
      new WPSPanel(this.api),
      new DisasterPanel(this.api),
      new MarketPanel(this.api),
      new StabilityPanel(this.api),
      new InsightsPanel(this.api),
    ];

    for (const panel of panels) {
      const el = panel.render();
      sidebar.appendChild(el);
    }

    this.panelInstances = panels;
  }

  private registerKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // TODO: open search modal
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
      statusEl.textContent = "LIVE";
      statusEl.style.color = "";
    } catch {
      statusEl.textContent = "OFFLINE";
      statusEl.style.color = "var(--accent-red, #ef5350)";
    }
  }
}
