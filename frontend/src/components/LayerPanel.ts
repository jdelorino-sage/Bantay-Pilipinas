export interface LayerDefinition {
  id: string;
  name: string;
  color: string;
  icon: string;
  defaultOn: boolean;
}

const LAYERS: LayerDefinition[] = [
  { id: "wps-features", name: "WPS FEATURES", color: "#ffa726", icon: "\u{1F7E0}", defaultOn: true },
  { id: "intel-hotspots", name: "INTEL HOTSPOTS", color: "#ef5350", icon: "\u26A0", defaultOn: true },
  { id: "conflict-zones", name: "CONFLICT ZONES", color: "#ef5350", icon: "\u2716", defaultOn: true },
  { id: "edca-sites", name: "MILITARY BASES", color: "#4fc3f7", icon: "\u25B2", defaultOn: true },
  { id: "volcanoes", name: "ACTIVE VOLCANOES", color: "#ef5350", icon: "\u{1F30B}", defaultOn: true },
  { id: "fault-lines", name: "FAULT LINES", color: "#ffa726", icon: "\u2014", defaultOn: false },
  { id: "submarine-cables", name: "UNDERSEA CABLES", color: "#4fc3f7", icon: "\u2014", defaultOn: false },
  { id: "major-ports", name: "MAJOR PORTS", color: "#4fc3f7", icon: "\u25A0", defaultOn: false },
  { id: "weather-systems", name: "WEATHER SYSTEMS", color: "#ffa726", icon: "\u26C5", defaultOn: false },
  { id: "military-activity", name: "MILITARY ACTIVITY", color: "#ef5350", icon: "\u2708", defaultOn: true },
  { id: "ship-traffic", name: "SHIP TRAFFIC", color: "#66bb6a", icon: "\u{1F6A2}", defaultOn: false },
  { id: "typhoon-tracks", name: "TYPHOON TRACKS", color: "#ffa726", icon: "\u{1F300}", defaultOn: false },
];

const TIME_RANGES = [
  { id: "1h", label: "1h", ms: 3_600_000 },
  { id: "6h", label: "6h", ms: 21_600_000 },
  { id: "24h", label: "24h", ms: 86_400_000 },
  { id: "48h", label: "48h", ms: 172_800_000 },
  { id: "7d", label: "7d", ms: 604_800_000 },
  { id: "all", label: "All", ms: 0 },
];

export class LayerPanel {
  private layerState: Map<string, boolean>;
  private activeRange = "7d";

  constructor() {
    this.layerState = new Map(LAYERS.map((l) => [l.id, l.defaultOn]));
  }

  render(): HTMLElement {
    const el = document.createElement("aside");
    el.className = "layer-sidebar";
    el.innerHTML = this.buildHTML();
    this.attachEvents(el);
    return el;
  }

  private buildHTML(): string {
    const searchHTML = `<input type="text" class="layer-search" placeholder="Search layers..." />`;

    const timeHTML = TIME_RANGES.map(
      (t) =>
        `<button class="time-range-btn${t.id === this.activeRange ? " active" : ""}" data-range="${t.id}">${t.label}</button>`
    ).join("");

    const layerItems = LAYERS.map((l) => {
      const checked = this.layerState.get(l.id) ? "checked" : "";
      return `<label class="layer-item" data-layer="${l.id}">
        <input type="checkbox" class="layer-toggle" data-layer-id="${l.id}" ${checked} />
        <span class="layer-icon" style="color:${l.color}">${l.icon}</span>
        <span class="layer-name">${l.name}</span>
      </label>`;
    }).join("");

    return `
      ${searchHTML}
      <div class="time-range-buttons">${timeHTML}</div>
      <div class="layer-help">
        <span class="layer-section-title">LAYERS</span>
        <span class="layer-help-icon" title="Toggle map layers">?</span>
      </div>
      <div class="layer-list">${layerItems}</div>
    `;
  }

  private attachEvents(el: HTMLElement): void {
    const search = el.querySelector<HTMLInputElement>(".layer-search");
    if (search) {
      search.addEventListener("input", () => {
        const q = search.value.toLowerCase();
        el.querySelectorAll<HTMLElement>(".layer-item").forEach((item) => {
          const name = item.querySelector(".layer-name")?.textContent?.toLowerCase() || "";
          item.style.display = name.includes(q) ? "" : "none";
        });
      });
    }

    el.querySelectorAll<HTMLInputElement>(".layer-toggle").forEach((cb) => {
      cb.addEventListener("change", () => {
        const layerId = cb.dataset.layerId!;
        this.layerState.set(layerId, cb.checked);
        document.dispatchEvent(
          new CustomEvent("layer-toggle", { detail: { layerId, visible: cb.checked } })
        );
      });
    });

    el.querySelectorAll<HTMLButtonElement>(".time-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.activeRange = btn.dataset.range!;
        el.querySelectorAll(".time-range-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const range = TIME_RANGES.find((t) => t.id === this.activeRange);
        document.dispatchEvent(
          new CustomEvent("time-range-change", { detail: { rangeId: this.activeRange, ms: range?.ms ?? 0 } })
        );
      });
    });
  }

  getVisibleLayers(): string[] {
    return LAYERS.filter((l) => this.layerState.get(l.id)).map((l) => l.id);
  }
}
