import Globe, { type GlobeInstance } from "globe.gl";
import { PH_CENTER } from "../config/geo";
import { WPS_FEATURES, EDCA_SITES } from "../config/geo";

export class GlobeMap {
  private globe: GlobeInstance | null = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  init(): void {
    const points = [
      ...WPS_FEATURES.map((f) => ({
        lat: f.lat,
        lng: f.lon,
        name: f.name,
        color: "#ffa726",
        size: 0.3,
      })),
      ...EDCA_SITES.map((s) => ({
        lat: s.lat,
        lng: s.lon,
        name: s.name,
        color: "#4fc3f7",
        size: 0.25,
      })),
    ];

    this.globe = new Globe(this.container)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
      .pointsData(points)
      .pointLat("lat")
      .pointLng("lng")
      .pointColor("color")
      .pointAltitude(0.01)
      .pointRadius("size")
      .pointLabel("name")
      .width(this.container.clientWidth)
      .height(this.container.clientHeight);

    this.globe.pointOfView({ lat: PH_CENTER.lat, lng: PH_CENTER.lon, altitude: 2.5 }, 1000);

    const resizeObserver = new ResizeObserver(() => {
      if (this.globe) {
        this.globe.width(this.container.clientWidth).height(this.container.clientHeight);
      }
    });
    resizeObserver.observe(this.container);
  }

  destroy(): void {
    this.globe = null;
    this.container.innerHTML = "";
  }
}
