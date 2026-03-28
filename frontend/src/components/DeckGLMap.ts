import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PH_CENTER, PH_DEFAULT_ZOOM, WPS_FEATURES, EDCA_SITES, ACTIVE_VOLCANOES, FAULT_LINES } from "../config/geo";
import { SUBMARINE_CABLES, MAJOR_PORTS } from "../config/infrastructure";
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
      type: "circle",
      source: "military-activity",
      paint: {
        "circle-radius": 6,
        "circle-color": ["match", ["get", "classification"], "ph-military", "#4fc3f7", "#ef5350"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.9,
      },
    });

    this.map.addLayer({
      id: "military-activity-label",
      type: "symbol",
      source: "military-activity",
      layout: {
        "text-field": ["get", "callsign"],
        "text-size": 9,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
      },
      paint: { "text-color": "#ef5350", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 7,
    });

    this.addPopup("military-activity-circle", (props) =>
      `<strong>${props.callsign || "Unknown"}</strong><br/>Alt: ${props.altitude}ft<br/>${props.classification}`
    );

    this.fetchMilitaryFlights();
    setInterval(() => this.fetchMilitaryFlights(), 300_000);
  }

  private async fetchMilitaryFlights(): Promise<void> {
    if (!this.map) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/military`);
      if (!res.ok) return;
      const json = await res.json();
      const flights = json.data || [];
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: flights.map((f: { lat: number; lon: number; callsign: string | null; altitude: number; classification: string }) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [f.lon, f.lat] },
          properties: { callsign: f.callsign || "Unknown", altitude: Math.round(f.altitude).toString(), classification: f.classification },
        })),
      };
      const src = this.map.getSource("military-activity") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geojson);
    } catch {
      // silently fail
    }
  }

  private addShipTraffic(): void {
    if (!this.map) return;

    const emptyGeoJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    this.map.addSource("ship-traffic", { type: "geojson", data: emptyGeoJSON });

    this.map.addLayer({
      id: "ship-traffic-circle",
      type: "circle",
      source: "ship-traffic",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 4,
        "circle-color": [
          "match", ["get", "classification"],
          "ccg", "#ef5350", "plan", "#ef5350", "pafmm", "#ef5350",
          "ph-navy", "#4fc3f7", "ph-coast-guard", "#4fc3f7",
          "us-navy", "#4fc3f7",
          "#66bb6a",
        ],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.8,
      },
    });

    this.map.addLayer({
      id: "ship-traffic-label",
      type: "symbol",
      source: "ship-traffic",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-offset": [0, 1.3],
        "text-anchor": "top",
        visibility: "none",
      },
      paint: { "text-color": "#66bb6a", "text-halo-color": "#000", "text-halo-width": 1 },
      minzoom: 8,
    });

    this.addPopup("ship-traffic-circle", (props) =>
      `<strong>${props.name || "Unknown"}</strong><br/>${props.classification.toUpperCase()}<br/>${props.nearFeature || "Open sea"}`
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

  private startPulseAnimation(): void {
    if (!this.map) return;
    let phase = 0;
    const pulseLayers = [
      { id: "wps-features-circle", baseRadius: 7, baseOpacity: 0.85 },
      { id: "volcanoes-circle", baseRadius: 5, baseOpacity: 0.85 },
      { id: "intel-hotspots-circle", baseRadius: 6, baseOpacity: 0.85 },
      { id: "military-activity-circle", baseRadius: 6, baseOpacity: 0.9 },
    ];
    const animate = () => {
      if (!this.map) return;
      phase += 0.03;
      const pulse = Math.sin(phase * Math.PI * 2);
      const scale = 1 + 0.25 * pulse;
      const opacityShift = 0.15 * pulse;

      for (const layer of pulseLayers) {
        try {
          this.map.setPaintProperty(layer.id, "circle-radius", layer.baseRadius * scale);
          this.map.setPaintProperty(layer.id, "circle-opacity", layer.baseOpacity + opacityShift);
        } catch {
          // layer may not exist
        }
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

  private addPopup(layerId: string, html: (props: Record<string, string>) => string): void {
    if (!this.map) return;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

    this.map.on("mouseenter", layerId, (e) => {
      if (!this.map || !e.features?.[0]) return;
      this.map.getCanvas().style.cursor = "pointer";
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const props = e.features[0].properties as Record<string, string>;
      popup.setLngLat(coords).setHTML(html(props)).addTo(this.map);
    });

    this.map.on("mouseleave", layerId, () => {
      if (!this.map) return;
      this.map.getCanvas().style.cursor = "";
      popup.remove();
    });
  }

  updateLayers(_layers: unknown[]): void {
    // Reserved for future deck.gl overlay integration
  }
}
