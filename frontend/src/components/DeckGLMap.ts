import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PH_CENTER, PH_DEFAULT_ZOOM, WPS_FEATURES, EDCA_SITES, ACTIVE_VOLCANOES, FAULT_LINES } from "../config/geo";
import { SUBMARINE_CABLES, MAJOR_PORTS } from "../config/infrastructure";
import type { WPSFeature, EDCASite, VolcanoEntry } from "../config/geo";

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
};

export class DeckGLMap {
  private map: maplibregl.Map | null = null;

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
    });

    document.addEventListener("layer-toggle", ((e: CustomEvent) => {
      const { layerId, visible } = e.detail;
      this.setLayerVisibility(layerId, visible);
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
    // Future: update deck.gl overlay layers
  }
}
