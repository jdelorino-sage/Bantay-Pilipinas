import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PH_CENTER, PH_DEFAULT_ZOOM, WPS_FEATURES, EDCA_SITES, ACTIVE_VOLCANOES, FAULT_LINES } from "../config/geo";
import { SUBMARINE_CABLES, MAJOR_PORTS } from "../config/infrastructure";
import { OIL_DEPOTS } from "../config/energy";
import { PH_EEZ_POLYGON, SHIPPING_LANES, FLOOD_ZONES, WEATHER_CODES } from "../config/geoint";
import type { WPSFeature, EDCASite, VolcanoEntry } from "../config/geo";
import type { TrackedVessel } from "@bantay-pilipinas/shared";

interface LayerGroup {
  sourceId: string;
  layerIds: string[];
}

const LAYER_GROUPS: Record<string, LayerGroup> = {
  "wps-features": { sourceId: "wps-features", layerIds: ["wps-features-circle", "wps-features-label"] },
  "edca-sites": { sourceId: "edca-sites", layerIds: ["edca-sites-circle", "edca-sites-label"] },
  "volcanoes": { sourceId: "volcanoes", layerIds: ["volcanoes-circle", "volcanoes-label"] },
  "fault-lines": { sourceId: "fault-lines", layerIds: ["fault-lines-line", "fault-lines-label"] },
  "submarine-cables": { sourceId: "submarine-cables", layerIds: ["submarine-cables-circle", "submarine-cables-label"] },
  "major-ports": { sourceId: "major-ports", layerIds: ["major-ports-circle", "major-ports-label"] },
  "military-activity": { sourceId: "military-activity", layerIds: ["military-activity-circle", "military-activity-label"] },
  "ship-traffic": { sourceId: "ship-traffic", layerIds: ["ship-traffic-circle", "ship-traffic-label"] },
  "typhoon-tracks": { sourceId: "typhoon-tracks", layerIds: ["typhoon-tracks-line", "typhoon-tracks-point"] },
  "weather-systems": { sourceId: "weather-systems", layerIds: ["weather-systems-circle", "weather-systems-label"] },
  "intel-hotspots": { sourceId: "intel-hotspots", layerIds: ["intel-hotspots-circle", "intel-hotspots-label"] },
  "conflict-zones": { sourceId: "conflict-zones", layerIds: ["conflict-zones-fill"] },
  "news-signals": { sourceId: "news-signals", layerIds: ["news-signals-circle", "news-signals-label"] },
  "oil-depots": { sourceId: "oil-depots", layerIds: ["oil-depots-circle", "oil-depots-label"] },
  "weather-data": { sourceId: "weather-data", layerIds: ["weather-data-circle", "weather-data-label"] },
  "eez-boundary": { sourceId: "eez-boundary", layerIds: ["eez-boundary-line"] },
  "shipping-lanes": { sourceId: "shipping-lanes", layerIds: ["shipping-lanes-line", "shipping-lanes-label"] },
  "flood-zones": { sourceId: "flood-zones", layerIds: ["flood-zones-fill"] },
};

const BARMM_POLYGON: [number, number][] = [
  [121.5, 5.5], [124.5, 5.5], [124.5, 8.5], [121.5, 8.5], [121.5, 5.5],
];

export class DeckGLMap {
  private map: maplibregl.Map | null = null;
  private vesselStore: Map<number, TrackedVessel> = new Map();

  constructor(private container: HTMLElement) {}

  async init(): Promise<void> {
    this.map = new maplibregl.Map({
      container: this.container,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [PH_CENTER.lon, PH_CENTER.lat],
      zoom: PH_DEFAULT_ZOOM,
      maxBounds: [
        [114, 3],
        [128, 22],
      ],
      attributionControl: false,
    });

    this.map.addControl(new maplibregl.NavigationControl(), "top-left");
    this.map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    this.map.on("load", () => {
      this.addWPSFeatures();
      this.addEDCASites();
      this.addVolcanoes();
      this.addFaultLines();
      this.addSubmarineCables();
      this.addMajorPorts();
      this.addMilitaryActivity();
      this.addShipTraffic();
      this.addTyphoonTracks();
      this.addWeatherSystems();
      this.addIntelHotspots();
      this.addConflictZones();
      this.addNewsSignals();
      this.addOilDepots();
      this.addWeatherData();
      this.addEEZBoundary();
      this.addShippingLanes();
      this.addFloodZones();
      this.startPulseAnimation();
    });

    document.addEventListener("layer-toggle", ((e: CustomEvent) => {
      const { layerId, visible } = e.detail;
      this.setLayerVisibility(layerId, visible);
    }) as EventListener);

    document.addEventListener("ais-vessel-update", ((e: CustomEvent<TrackedVessel>) => {
      this.vesselStore.set(e.detail.mmsi, e.detail);
      this.updateShipTrafficSource();
    }) as EventListener);
  }

  private setLayerVisibility(groupId: string, visible: boolean): void {
    if (!this.map) return;
    const group = LAYER_GROUPS[groupId];
    if (!group) return;

    const value = visible ? "visible" : "none";
    for (const layerId of group.layerIds) {
      try {
        this.map.setLayoutProperty(layerId, "visibility", value);
      } catch {
        // layer may not exist yet
      }
    }
  }

  private addWPSFeatures(): void {
    if (!this.map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: WPS_FEATURES.map((f: WPSFeature) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [f.lon, f.lat] },
        properties: { name: f.name, filipinoName: f.filipinoName, status: f.status },
      })),
    };

    this.map.addSource("wps-features", { type: "geojson", data: geojson });

    this.map.addLayer({
      id: "wps-features-circle",
      type: "circle",
      source: "wps-features",
      paint: {
        "circle-radius": 7,
        "circle-color": "#ffa726",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff3e0",
        "circle-opacity": 0.85,
      },
    });

    this.map.addLayer({
      id: "wps-features-label",
      type: "symbol",
      source: "wps-features",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 10,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#ffa726",
        "text-halo-color": "#000",
        "text-halo-width": 1,
      },
    });

    this.addPopup("wps-features-circle", (props) =>
      `<strong>${props.name}</strong><br/><em>${props.filipinoName}</em><br/>${props.status}`
    );
  }

  private addEDCASites(): void {
    if (!this.map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: EDCA_SITES.map((s: EDCASite) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] },
        properties: { name: s.name, location: s.location, branch: s.branch },
      })),
    };

    this.map.addSource("edca-sites", { type: "geojson", data: geojson });

    this.map.addLayer({
      id: "edca-sites-circle",
      type: "circle",
      source: "edca-sites",
      paint: {
        "circle-radius": 6,
        "circle-color": "#4fc3f7",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#e1f5fe",
        "circle-opacity": 0.85,
      },
    });

    this.map.addLayer({
      id: "edca-sites-label",
      type: "symbol",
      source: "edca-sites",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#4fc3f7",
        "text-halo-color": "#000",
        "text-halo-width": 1,
      },
      minzoom: 6,
    });

    this.addPopup("edca-sites-circle", (props) =>
      `<strong>${props.name}</strong><br/>${props.location}<br/>Branch: ${props.branch}`
    );
  }

  private addVolcanoes(): void {
    if (!this.map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: ACTIVE_VOLCANOES.map((v: VolcanoEntry) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [v.lon, v.lat] },
        properties: { name: v.name },
      })),
    };

    this.map.addSource("volcanoes", { type: "geojson", data: geojson });

    this.map.addLayer({
      id: "volcanoes-circle",
      type: "circle",
      source: "volcanoes",
      paint: {
        "circle-radius": 5,
        "circle-color": "#ef5350",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffcdd2",
        "circle-opacity": 0.85,
      },
    });

    this.map.addLayer({
      id: "volcanoes-label",
      type: "symbol",
      source: "volcanoes",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#ef5350",
        "text-halo-color": "#000",
        "text-halo-width": 1,
      },
      minzoom: 6,
    });

    this.addPopup("volcanoes-circle", (props) =>
      `<strong>${props.name}</strong><br/>Active Volcano`
    );
  }

  private addFaultLines(): void {
    if (!this.map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: FAULT_LINES.map((f) => ({
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: f.path },
        properties: { name: f.name, region: f.region },
      })),
    };

    this.map.addSource("fault-lines", { type: "geojson", data: geojson });

    this.map.addLayer({
      id: "fault-lines-line",
      type: "line",
      source: "fault-lines",
      layout: { visibility: "none" },
      paint: {
        "line-color": "#ffa726",
        "line-width": 2,
        "line-opacity": 0.7,
        "line-dasharray": [4, 2],
      },
    });

    this.map.addLayer({
      id: "fault-lines-label",
      type: "symbol",
      source: "fault-lines",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
        visibility: "none",
      },
      paint: {
        "text-color": "#ffa726",
        "text-halo-color": "#000",
        "text-halo-width": 1,
      },
    });

    this.addPopup("fault-lines-circle", (props) =>
      `<strong>${props.name}</strong><br/>${props.region}`
    );
  }

  private addSubmarineCables(): void {
    if (!this.map) return;

    const features = SUBMARINE_CABLES.flatMap((cable) =>
      cable.landingPoints.map((lp) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [lp.lon, lp.lat] },
        properties: { name: cable.name, landing: lp.name },
      }))
    );

    const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

    this.map.addSource("submarine-cables", { type: "geojson", data: geojson });

    this.map.addLayer({
      id: "submarine-cables-circle",
      type: "circle",
      source: "submarine-cables",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 5,
        "circle-color": "#4fc3f7",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#b3e5fc",
        "circle-opacity": 0.8,
      },
    });

    this.map.addLayer({
      id: "submarine-cables-label",
      type: "symbol",
      source: "submarine-cables",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
        visibility: "none",
      },
      paint: {
        "text-color": "#4fc3f7",
        "text-halo-color": "#000",
        "text-halo-width": 1,
      },
    });

    this.addPopup("submarine-cables-circle", (props) =>
      `<strong>${props.name}</strong><br/>Landing: ${props.landing}`
    );
  }

  private addMajorPorts(): void {
    if (!this.map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: MAJOR_PORTS.map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
        properties: { name: p.name },
      })),
    };

    this.map.addSource("major-ports", { type: "geojson", data: geojson });

    this.map.addLayer({
      id: "major-ports-circle",
      type: "circle",
      source: "major-ports",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 5,
        "circle-color": "#4fc3f7",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#e1f5fe",
        "circle-opacity": 0.8,
      },
    });

    this.map.addLayer({
      id: "major-ports-label",
      type: "symbol",
      source: "major-ports",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
        visibility: "none",
      },
      paint: {
        "text-color": "#4fc3f7",
        "text-halo-color": "#000",
        "text-halo-width": 1,
      },
    });

    this.addPopup("major-ports-circle", (props) =>
      `<strong>${props.name}</strong><br/>Major Port`
    );
  }

  private addMilitaryActivity(): void {
    if (!this.map) return;

    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("military-activity", { type: "geojson", data: emptyGeoJSON });

    this.map.addLayer({
      id: "military-activity-circle",
      type: "symbol",
      source: "military-activity",
      layout: {
        "text-field": "\u2708\uFE0E",
        "text-size": 22,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-rotate": ["get", "heading"],
        "text-font": ["Open Sans Bold"],
      },
      paint: {
        "text-color": ["match", ["get", "classification"], "ph-military", "#4fc3f7", "civilian", "#90caf9", "#ef5350"],
        "text-halo-color": "#000",
        "text-halo-width": 2,
        "text-opacity": 0.95,
      },
    });

    this.map.addLayer({
      id: "military-activity-label",
      type: "symbol",
      source: "military-activity",
      layout: {
        "text-field": ["get", "callsign"],
        "text-size": 9,
        "text-offset": [0, 2],
        "text-anchor": "top",
      },
      paint: { "text-color": "#ef5350", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 7,
    });

    this.addPopup("military-activity-circle", (props) =>
      `<strong>\u2708 ${props.callsign || "Unknown"}</strong><br/>Altitude: ${props.altitude} ft<br/>Classification: ${props.classification}<br/>Heading: ${props.heading}\u00B0`
    );

    this.fetchMilitaryFlights();
    setInterval(() => this.fetchMilitaryFlights(), 300_000);
  }

  private async fetchMilitaryFlights(): Promise<void> {
    if (!this.map) return;

    let flights: { lat: number; lon: number; callsign: string | null; altitude: number; classification: string }[] = [];

    // Try backend first
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/military`);
      if (res.ok) {
        const json = await res.json();
        flights = json.data || [];
      }
    } catch { /* fall through */ }

    // Fallback: try OpenSky public API directly (no auth, rate-limited)
    if (flights.length === 0) {
      try {
        const res = await fetch(
          "https://opensky-network.org/api/states/all?lamin=4.5&lomin=116&lamax=21.5&lomax=127",
          { signal: AbortSignal.timeout(15_000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.states) {
            const milPrefixes = ["CALI", "NAVY", "RCH", "JAKE", "EVAC", "SAM", "PAF", "AFP", "CNV"];
            for (const s of data.states) {
              const cs = (s[1] as string | null)?.trim().toUpperCase() || "";
              const lat = s[6] as number | null;
              const lon = s[5] as number | null;
              if (!lat || !lon) continue;
              let cls = "civilian";
              if (cs.startsWith("PAF") || cs.startsWith("AFP")) cls = "ph-military";
              else if (milPrefixes.some((p) => cs.startsWith(p))) cls = "military";
              flights.push({
                lat, lon, callsign: cs || null,
                altitude: (s[7] as number) || 0,
                classification: cls,
              });
            }
          }
        }
      } catch { /* silently fail */ }
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: flights.map((f) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [f.lon, f.lat] },
        properties: {
          callsign: f.callsign || "Unknown",
          altitude: Math.round(f.altitude).toString(),
          classification: f.classification,
          heading: "0",
        },
      })),
    };
    const src = this.map.getSource("military-activity") as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(geojson);
  }

  private addShipTraffic(): void {
    if (!this.map) return;

    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("ship-traffic", { type: "geojson", data: emptyGeoJSON });

    this.map.addLayer({
      id: "ship-traffic-circle",
      type: "symbol",
      source: "ship-traffic",
      layout: {
        "text-field": "\u2693\uFE0E",
        "text-size": 18,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-font": ["Open Sans Bold"],
        visibility: "none",
      },
      paint: {
        "text-color": [
          "match", ["get", "classification"],
          "ccg", "#ef5350", "plan", "#ef5350", "pafmm", "#ef5350",
          "ph-navy", "#4fc3f7", "ph-coast-guard", "#4fc3f7",
          "us-navy", "#4fc3f7",
          "#66bb6a",
        ],
        "text-halo-color": "#000",
        "text-halo-width": 2,
        "text-opacity": 0.95,
      },
    });

    this.map.addLayer({
      id: "ship-traffic-label",
      type: "symbol",
      source: "ship-traffic",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-offset": [0, 1.8],
        "text-anchor": "top",
        visibility: "none",
      },
      paint: { "text-color": "#66bb6a", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 8,
    });

    this.addPopup("ship-traffic-circle", (props) =>
      `<strong>\u{1F6A2} ${props.name || "Unknown"}</strong><br/>Type: ${props.classification.toUpperCase()}<br/>Near: ${props.nearFeature || "Open sea"}`
    );
  }

  private updateShipTrafficSource(): void {
    if (!this.map) return;
    const features = Array.from(this.vesselStore.values()).map((v) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [v.lon, v.lat] },
      properties: { name: v.name || "Unknown", classification: v.classification, nearFeature: v.nearFeature || "" },
    }));
    const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
    const src = this.map.getSource("ship-traffic") as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(geojson);
  }

  private addTyphoonTracks(): void {
    if (!this.map) return;

    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("typhoon-tracks", { type: "geojson", data: emptyGeoJSON });

    this.map.addLayer({
      id: "typhoon-tracks-line",
      type: "line",
      source: "typhoon-tracks",
      layout: { visibility: "none" },
      filter: ["==", ["geometry-type"], "LineString"],
      paint: { "line-color": "#ffa726", "line-width": 3, "line-opacity": 0.8 },
    });

    this.map.addLayer({
      id: "typhoon-tracks-point",
      type: "circle",
      source: "typhoon-tracks",
      layout: { visibility: "none" },
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 8,
        "circle-color": "#ffa726",
        "circle-stroke-width": 3,
        "circle-stroke-color": "#fff3e0",
        "circle-opacity": 0.9,
      },
    });

    this.addPopup("typhoon-tracks-point", (props) =>
      `<strong>${props.name}</strong><br/>Wind: ${props.wind} kph`
    );

    this.fetchTyphoonData();
    setInterval(() => this.fetchTyphoonData(), 1_800_000);
  }

  private async fetchTyphoonData(): Promise<void> {
    if (!this.map) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/disaster`);
      if (!res.ok) return;
      const json = await res.json();
      const typhoons = json.data?.typhoons || [];
      const features: GeoJSON.Feature[] = [];

      for (const t of typhoons) {
        if (!t.isActive) continue;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [t.lon, t.lat] },
          properties: { name: t.localName || t.internationalName || "Unknown", wind: String(t.maxWindKph || 0) },
        });
        if (t.forecastTrack && t.forecastTrack.length >= 2) {
          const coords = t.forecastTrack.map((p: { lon: number; lat: number }) => [p.lon, p.lat]);
          coords.unshift([t.lon, t.lat]);
          features.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: { name: t.localName || t.internationalName || "Unknown" },
          });
        }
      }

      const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
      const src = this.map.getSource("typhoon-tracks") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geojson);
    } catch {
      // silently fail
    }
  }

  private addWeatherSystems(): void {
    if (!this.map) return;

    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("weather-systems", { type: "geojson", data: emptyGeoJSON });

    this.map.addLayer({
      id: "weather-systems-circle",
      type: "circle",
      source: "weather-systems",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 12,
        "circle-color": "#ffa726",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff3e0",
        "circle-opacity": 0.6,
      },
    });

    this.map.addLayer({
      id: "weather-systems-label",
      type: "symbol",
      source: "weather-systems",
      layout: {
        "text-field": ["get", "title"],
        "text-size": 10,
        "text-offset": [0, 2],
        "text-anchor": "top",
        visibility: "none",
      },
      paint: { "text-color": "#ffa726", "text-halo-color": "#000", "text-halo-width": 1 },
    });

    this.addPopup("weather-systems-circle", (props) =>
      `<strong>${props.title}</strong><br/>${props.type}`
    );

    this.fetchWeatherSystems();
    setInterval(() => this.fetchWeatherSystems(), 1_800_000);
  }

  private async fetchWeatherSystems(): Promise<void> {
    if (!this.map) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/disaster`);
      if (!res.ok) return;
      const json = await res.json();
      const advisories = json.data?.weatherAdvisories || [];
      const features: GeoJSON.Feature[] = advisories
        .filter((a: { lat: number | null; lon: number | null; isActive: boolean }) => a.lat != null && a.lon != null && a.isActive)
        .map((a: { lat: number; lon: number; title: string; type: string }) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [a.lon, a.lat] },
          properties: { title: a.title, type: a.type },
        }));

      const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
      const src = this.map.getSource("weather-systems") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geojson);
    } catch {
      // silently fail
    }
  }

  private addIntelHotspots(): void {
    if (!this.map) return;

    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("intel-hotspots", { type: "geojson", data: emptyGeoJSON });

    this.map.addLayer({
      id: "intel-hotspots-circle",
      type: "circle",
      source: "intel-hotspots",
      paint: {
        "circle-radius": 6,
        "circle-color": "#ef5350",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffcdd2",
        "circle-opacity": 0.85,
      },
    });

    this.map.addLayer({
      id: "intel-hotspots-label",
      type: "symbol",
      source: "intel-hotspots",
      layout: {
        "text-field": ["get", "label"],
        "text-size": 9,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
      },
      paint: { "text-color": "#ef5350", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 7,
    });

    this.addPopup("intel-hotspots-circle", (props) =>
      `<strong>${props.label}</strong><br/>${props.type}`
    );

    this.fetchIntelHotspots();
    setInterval(() => this.fetchIntelHotspots(), 3_600_000);
  }

  private async fetchIntelHotspots(): Promise<void> {
    if (!this.map) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/risk-scores`);
      if (!res.ok) return;
      const json = await res.json();
      const regions = json.data?.regions || [];

      const regionCoords: Record<string, [number, number]> = {
        ncr: [120.9842, 14.5995],
        barmm: [124.25, 6.95],
        wps: [116.0, 12.0],
        car: [121.0, 16.5],
        "ev-bicol": [124.5, 12.0],
      };

      const features: GeoJSON.Feature[] = regions
        .filter((r: { level: string }) => r.level === "elevated" || r.level === "high" || r.level === "severe")
        .map((r: { regionId: string; score: number; level: string }) => {
          const coords = regionCoords[r.regionId];
          if (!coords) return null;
          return {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: coords },
            properties: { label: r.regionId.toUpperCase(), type: `${r.level} (${r.score.toFixed(1)})` },
          };
        })
        .filter(Boolean);

      const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: features as GeoJSON.Feature[] };
      const src = this.map.getSource("intel-hotspots") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geojson);
    } catch {
      // silently fail
    }
  }

  private addNewsSignals(): void {
    if (!this.map) return;

    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("news-signals", { type: "geojson", data: emptyGeoJSON });

    this.map.addLayer({
      id: "news-signals-circle",
      type: "circle",
      source: "news-signals",
      paint: {
        "circle-radius": 8,
        "circle-color": [
          "match", ["get", "category"],
          "disaster", "#ef5350",
          "wps-maritime", "#ffa726",
          "defense", "#ab47bc",
          "crime", "#ef5350",
          "economy", "#66bb6a",
          "#4fc3f7",
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.85,
      },
    });

    this.map.addLayer({
      id: "news-signals-label",
      type: "symbol",
      source: "news-signals",
      layout: {
        "text-field": ["get", "label"],
        "text-size": 9,
        "text-offset": [0, 1.8],
        "text-anchor": "top",
        "text-max-width": 12,
      },
      paint: {
        "text-color": "#e0e6f0",
        "text-halo-color": "#000",
        "text-halo-width": 1,
      },
      minzoom: 7,
    });

    this.addPopup("news-signals-circle", (props) =>
      `<strong>${props.title}</strong><br/><em>${props.source}</em><br/>${props.region} &middot; ${props.time}`
    );

    this.fetchNewsSignals();
    setInterval(() => this.fetchNewsSignals(), 120_000);
  }

  private async fetchNewsSignals(): Promise<void> {
    if (!this.map) return;
    try {
      interface GeoArticle { title: string; lat?: number | null; lon?: number | null; category: string; source: string; regionId?: string; publishedAt: string | null; url?: string }
      let articles: GeoArticle[] = [];

      // Try backend geo endpoint first
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/news/geo`);
        if (res.ok) {
          const json = await res.json();
          articles = (json.data || []).filter((a: GeoArticle) => a.lat != null && a.lon != null);
        }
      } catch { /* fall through */ }

      // Fallback: try regular news with region filter
      if (articles.length === 0) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/news`);
          if (res.ok) {
            const json = await res.json();
            articles = (json.data || []).filter((a: GeoArticle) => a.lat != null && a.lon != null);
          }
        } catch { /* fall through */ }
      }

      // Fallback: fetch directly from Google News geo RSS feeds via rss2json
      if (articles.length === 0) {
        const geoFeeds = [
          { url: "https://news.google.com/rss/headlines/section/geo/Manila?hl=en-PH&gl=PH&ceid=PH:en", region: "manila", lat: 14.5995, lon: 120.9842 },
          { url: "https://news.google.com/rss/headlines/section/geo/Cebu?hl=en-PH&gl=PH&ceid=PH:en", region: "cebu", lat: 10.3157, lon: 123.8854 },
          { url: "https://news.google.com/rss/headlines/section/geo/Davao?hl=en-PH&gl=PH&ceid=PH:en", region: "davao", lat: 7.1907, lon: 125.4553 },
          { url: "https://news.google.com/rss/headlines/section/geo/Zamboanga?hl=en-PH&gl=PH&ceid=PH:en", region: "zamboanga", lat: 6.9214, lon: 122.079 },
          { url: "https://news.google.com/rss/headlines/section/geo/Iloilo?hl=en-PH&gl=PH&ceid=PH:en", region: "iloilo", lat: 10.7202, lon: 122.5621 },
          { url: "https://news.google.com/rss/headlines/section/geo/Cagayan+de+Oro?hl=en-PH&gl=PH&ceid=PH:en", region: "cdo", lat: 8.4542, lon: 124.6319 },
          { url: "https://news.google.com/rss/headlines/section/geo/Baguio?hl=en-PH&gl=PH&ceid=PH:en", region: "baguio", lat: 16.4023, lon: 120.596 },
          { url: "https://news.google.com/rss/headlines/section/geo/Tacloban?hl=en-PH&gl=PH&ceid=PH:en", region: "tacloban", lat: 11.2543, lon: 124.96 },
          { url: "https://news.google.com/rss/headlines/section/geo/Palawan?hl=en-PH&gl=PH&ceid=PH:en", region: "palawan", lat: 9.8349, lon: 118.7384 },
          { url: "https://news.google.com/rss/headlines/section/geo/Legazpi?hl=en-PH&gl=PH&ceid=PH:en", region: "legazpi", lat: 13.1391, lon: 123.7438 },
          { url: "https://news.google.com/rss/headlines/section/geo/Pampanga?hl=en-PH&gl=PH&ceid=PH:en", region: "pampanga", lat: 15.0794, lon: 120.62 },
          { url: "https://news.google.com/rss/headlines/section/geo/General+Santos?hl=en-PH&gl=PH&ceid=PH:en", region: "gensan", lat: 6.1164, lon: 125.1716 },
        ];

        const rss2json = "https://api.rss2json.com/v1/api.json?rss_url=";
        const fetches = geoFeeds.map(async (feed) => {
          try {
            const res = await fetch(`${rss2json}${encodeURIComponent(feed.url)}`, { signal: AbortSignal.timeout(8_000) });
            if (!res.ok) return;
            const json = await res.json();
            if (json.status !== "ok" || !json.items) return;
            for (const item of json.items.slice(0, 3)) {
              if (!item.title) continue;
              articles.push({
                title: item.title,
                lat: feed.lat,
                lon: feed.lon,
                category: "regional",
                source: `Local: ${feed.region.charAt(0).toUpperCase() + feed.region.slice(1)}`,
                regionId: feed.region,
                publishedAt: item.pubDate || null,
              });
            }
          } catch { /* skip */ }
        });
        await Promise.allSettled(fetches);
      }

      const features: GeoJSON.Feature[] = articles
        .filter((a): a is GeoArticle & { lat: number; lon: number } => a.lat != null && a.lon != null)
        .slice(0, 60)
        .map((a) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [a.lon, a.lat] },
          properties: {
            title: a.title.length > 80 ? a.title.slice(0, 77) + "..." : a.title,
            label: a.title.length > 30 ? a.title.slice(0, 27) + "..." : a.title,
            source: a.source,
            category: a.category,
            region: a.regionId || "",
            time: a.publishedAt ? new Date(a.publishedAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) : "",
            url: (a as GeoArticle & { url?: string }).url || "",
          },
        }));

      const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
      const src = this.map.getSource("news-signals") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geojson);
    } catch {
      // silently fail
    }
  }

  private startPulseAnimation(): void {
    if (!this.map) return;
    let time = 0;
    const circleLayers = [
      { id: "wps-features-circle", baseRadius: 7, baseOpacity: 0.85, speed: 0.006, phase: 0 },
      { id: "volcanoes-circle", baseRadius: 5, baseOpacity: 0.85, speed: 0.008, phase: 0.4 },
      { id: "intel-hotspots-circle", baseRadius: 6, baseOpacity: 0.85, speed: 0.005, phase: 0.7 },
      { id: "news-signals-circle", baseRadius: 8, baseOpacity: 0.85, speed: 0.007, phase: 0.5 },
      { id: "oil-depots-circle", baseRadius: 6, baseOpacity: 0.85, speed: 0.004, phase: 0.8 },
    ];
    const symbolLayers = [
      { id: "military-activity-circle", baseSize: 20, baseOpacity: 0.9, speed: 0.009, phase: 0.2 },
      { id: "ship-traffic-circle", baseSize: 16, baseOpacity: 0.9, speed: 0.007, phase: 0.6 },
      { id: "weather-data-circle", baseSize: 13, baseOpacity: 0.95, speed: 0.005, phase: 0.3 },
    ];
    const animate = () => {
      if (!this.map) return;
      time++;

      for (const layer of circleLayers) {
        const wave = Math.sin((time * layer.speed + layer.phase) * Math.PI * 2);
        const scale = 1 + 0.2 * wave;
        const opacityShift = 0.1 * wave;
        try {
          this.map.setPaintProperty(layer.id, "circle-radius", layer.baseRadius * scale);
          this.map.setPaintProperty(layer.id, "circle-opacity", Math.max(0.4, layer.baseOpacity + opacityShift));
        } catch { /* layer may not exist */ }
      }

      for (const layer of symbolLayers) {
        const wave = Math.sin((time * layer.speed + layer.phase) * Math.PI * 2);
        const opacityShift = 0.08 * wave;
        try {
          this.map.setPaintProperty(layer.id, "text-opacity", Math.max(0.5, layer.baseOpacity + opacityShift));
        } catch { /* layer may not exist */ }
      }

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private addConflictZones(): void {
    if (!this.map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [BARMM_POLYGON] },
          properties: { name: "BARMM", description: "Bangsamoro Autonomous Region" },
        },
      ],
    };

    this.map.addSource("conflict-zones", { type: "geojson", data: geojson });

    this.map.addLayer({
      id: "conflict-zones-fill",
      type: "fill",
      source: "conflict-zones",
      paint: {
        "fill-color": "#ef5350",
        "fill-opacity": 0.12,
        "fill-outline-color": "#ef5350",
      },
    });
  }

  private addOilDepots(): void {
    if (!this.map) return;
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: OIL_DEPOTS.map((d) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [d.lon, d.lat] },
        properties: { name: d.name, company: d.company, type: d.type, status: d.status, capacity: d.capacityBarrels ? `${(d.capacityBarrels / 1_000_000).toFixed(1)}M bbl` : "N/A" },
      })),
    };
    this.map.addSource("oil-depots", { type: "geojson", data: geojson });
    this.map.addLayer({
      id: "oil-depots-circle", type: "circle", source: "oil-depots",
      layout: { visibility: "none" },
      paint: { "circle-radius": 6, "circle-color": "#ff7043", "circle-stroke-width": 2, "circle-stroke-color": "#fff3e0", "circle-opacity": 0.85 },
    });
    this.map.addLayer({
      id: "oil-depots-label", type: "symbol", source: "oil-depots",
      layout: { "text-field": ["get", "name"], "text-size": 9, "text-offset": [0, 1.5], "text-anchor": "top", visibility: "none" },
      paint: { "text-color": "#ff7043", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 8,
    });
    this.addPopup("oil-depots-circle", (props) =>
      `<strong>${props.name}</strong><br/>Company: ${props.company}<br/>Type: ${props.type}<br/>Status: ${props.status}<br/>Capacity: ${props.capacity}`
    );
  }

  private addWeatherData(): void {
    if (!this.map) return;
    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("weather-data", { type: "geojson", data: emptyGeoJSON });
    this.map.addLayer({
      id: "weather-data-circle", type: "symbol", source: "weather-data",
      layout: {
        "text-field": ["concat", ["get", "icon"], " ", ["get", "label"]],
        "text-size": 13,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-font": ["Open Sans Bold"],
      },
      paint: {
        "text-color": ["match", ["get", "severity"],
          "storm", "#ef5350", "rain", "#42a5f5", "hot", "#ff7043", "#fff"],
        "text-halo-color": "rgba(0,0,0,0.8)",
        "text-halo-width": 2,
        "text-opacity": 0.95,
      },
    });
    this.map.addLayer({
      id: "weather-data-label", type: "symbol", source: "weather-data",
      layout: { "text-field": ["get", "condition"], "text-size": 9, "text-offset": [0, 1.5], "text-anchor": "top" },
      paint: { "text-color": "#aaa", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 7,
    });
    this.addPopup("weather-data-circle", (props) =>
      `<strong>${props.icon} ${props.city}</strong><br/>${props.condition}<br/>Temperature: ${props.temp}\u00B0C<br/>Wind: ${props.wind} km/h<br/>Humidity: ${props.humidity}%`
    );
    this.fetchWeatherData();
    setInterval(() => this.fetchWeatherData(), 900_000);
  }

  private async fetchWeatherData(): Promise<void> {
    if (!this.map) return;
    const cities = [
      { name: "Manila", lat: 14.5995, lon: 120.9842 },
      { name: "Cebu", lat: 10.3157, lon: 123.8854 },
      { name: "Davao", lat: 7.1907, lon: 125.4553 },
      { name: "Zamboanga", lat: 6.9214, lon: 122.079 },
      { name: "Iloilo", lat: 10.7202, lon: 122.5621 },
      { name: "CDO", lat: 8.4542, lon: 124.6319 },
      { name: "Baguio", lat: 16.4023, lon: 120.596 },
      { name: "Tacloban", lat: 11.2543, lon: 124.96 },
      { name: "Legazpi", lat: 13.1391, lon: 123.7438 },
      { name: "Palawan", lat: 9.8349, lon: 118.7384 },
      { name: "Pampanga", lat: 15.0794, lon: 120.62 },
      { name: "GenSan", lat: 6.1164, lon: 125.1716 },
    ];
    const features: GeoJSON.Feature[] = [];

    // Fetch each city individually for reliability
    const fetches = cities.map(async (c) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Asia/Manila`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return;
        const data = await res.json();
        const current = data?.current;
        if (!current) return;
        const code = current.weather_code ?? current.weathercode ?? 0;
        const condition = WEATHER_CODES[code] || "Unknown";
        const temp = Math.round(current.temperature_2m ?? 0);
        const wind = Math.round(current.wind_speed_10m ?? current.windspeed_10m ?? 0);
        const humidity = Math.round(current.relative_humidity_2m ?? 0);
        let severity = "clear";
        if (code >= 95) severity = "storm";
        else if (code >= 61) severity = "rain";
        else if (temp >= 35) severity = "hot";
        const iconMap: Record<string, string> = {
          storm: "\u26C8", rain: "\u{1F327}", hot: "\u2600", clear: "\u26C5",
        };
        features.push({
          type: "Feature", geometry: { type: "Point", coordinates: [c.lon, c.lat] },
          properties: {
            city: c.name, label: `${temp}\u00B0C`, condition,
            temp: String(temp), wind: String(wind), humidity: String(humidity),
            severity, icon: iconMap[severity] || "\u26C5",
          },
        });
      } catch { /* skip city */ }
    });
    await Promise.allSettled(fetches);

    try {
      const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
      const src = this.map?.getSource("weather-data") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geojson);
    } catch { /* silently fail */ }
  }

  private addEEZBoundary(): void {
    if (!this.map) return;
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "LineString", coordinates: PH_EEZ_POLYGON },
        properties: { name: "Philippine EEZ Boundary" },
      }],
    };
    this.map.addSource("eez-boundary", { type: "geojson", data: geojson });
    this.map.addLayer({
      id: "eez-boundary-line", type: "line", source: "eez-boundary",
      layout: { visibility: "none" },
      paint: { "line-color": "#4fc3f7", "line-width": 2, "line-opacity": 0.5, "line-dasharray": [6, 3] },
    });
  }

  private addShippingLanes(): void {
    if (!this.map) return;
    const features: GeoJSON.Feature[] = SHIPPING_LANES.map((lane) => ({
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates: lane.path },
      properties: { name: lane.name },
    }));
    const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
    this.map.addSource("shipping-lanes", { type: "geojson", data: geojson });
    this.map.addLayer({
      id: "shipping-lanes-line", type: "line", source: "shipping-lanes",
      layout: { visibility: "none" },
      paint: { "line-color": "#66bb6a", "line-width": 1.5, "line-opacity": 0.5, "line-dasharray": [4, 4] },
    });
    this.map.addLayer({
      id: "shipping-lanes-label", type: "symbol", source: "shipping-lanes",
      layout: { "text-field": ["get", "name"], "text-size": 9, "symbol-placement": "line", visibility: "none" },
      paint: { "text-color": "#66bb6a", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 7,
    });
  }

  private addFloodZones(): void {
    if (!this.map) return;
    const features: GeoJSON.Feature[] = FLOOD_ZONES.map((zone) => ({
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [zone.polygon] },
      properties: { name: zone.name },
    }));
    const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
    this.map.addSource("flood-zones", { type: "geojson", data: geojson });
    this.map.addLayer({
      id: "flood-zones-fill", type: "fill", source: "flood-zones",
      layout: { visibility: "none" },
      paint: { "fill-color": "#42a5f5", "fill-opacity": 0.15, "fill-outline-color": "#42a5f5" },
    });
  }

  private addPopup(layerId: string, html: (props: Record<string, string>) => string): void {
    if (!this.map) return;

    this.map.on("mouseenter", layerId, () => {
      if (this.map) this.map.getCanvas().style.cursor = "pointer";
    });

    this.map.on("mouseleave", layerId, () => {
      if (this.map) this.map.getCanvas().style.cursor = "";
    });

    this.map.on("click", layerId, (e) => {
      if (!this.map || !e.features?.[0]) return;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const props = e.features[0].properties as Record<string, string>;
      const content = `<div class="map-popup-content">${html(props)}</div>`;
      new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "320px", className: "bp-popup" })
        .setLngLat(coords)
        .setHTML(content)
        .addTo(this.map);
    });
  }

  updateLayers(_layers: unknown[]): void {
    // Reserved for future deck.gl overlay integration
  }
}
