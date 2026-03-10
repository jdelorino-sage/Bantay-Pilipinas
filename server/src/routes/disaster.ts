import type { FastifyInstance } from "fastify";
import type { ApiResponse, Typhoon, Earthquake, VolcanoStatus } from "@bantay-pilipinas/shared";
import { getStoredEarthquakes, getStoredVolcanoes } from "../scrapers/phivolcs-scraper.js";
import { getStoredTyphoons } from "../scrapers/pagasa-scraper.js";

const FALLBACK_EARTHQUAKES: Earthquake[] = [
  {
    id: 1,
    magnitude: 4.2,
    depthKm: 15,
    lat: 14.5,
    lon: 121.0,
    locationText: "10km SE of Tanay, Rizal",
    intensity: 3,
    tsunamiAdvisory: false,
    source: "phivolcs",
    occurredAt: new Date().toISOString(),
  },
];

const FALLBACK_VOLCANOES: VolcanoStatus[] = [
  {
    id: "taal",
    name: "Taal",
    lat: 14.002,
    lon: 120.993,
    alertLevel: 1,
    alertDescription: "Low level unrest",
    observations: ["Volcanic SO2 emissions measured at 2,500 tonnes/day"],
    lastBulletinAt: new Date().toISOString(),
  },
  {
    id: "mayon",
    name: "Mayon",
    lat: 13.257,
    lon: 123.685,
    alertLevel: 0,
    alertDescription: "Normal",
    observations: [],
    lastBulletinAt: new Date().toISOString(),
  },
];

export function registerDisasterRoutes(app: FastifyInstance): void {
  app.get("/api/disaster", async () => {
    let freshness = "live";

    let earthquakes: Earthquake[];
    try {
      const scraped = await getStoredEarthquakes(20);
      earthquakes = scraped.length > 0
        ? (scraped as unknown as Earthquake[])
        : FALLBACK_EARTHQUAKES;
      if (scraped.length === 0) freshness = "mock";
    } catch {
      earthquakes = FALLBACK_EARTHQUAKES;
      freshness = "mock";
    }

    let volcanoes: VolcanoStatus[];
    try {
      const scraped = await getStoredVolcanoes();
      volcanoes = scraped.length > 0
        ? (scraped as unknown as VolcanoStatus[])
        : FALLBACK_VOLCANOES;
    } catch {
      volcanoes = FALLBACK_VOLCANOES;
      freshness = "mock";
    }

    let typhoons: Typhoon[];
    try {
      const scraped = await getStoredTyphoons();
      typhoons = scraped as unknown as Typhoon[];
    } catch {
      typhoons = [];
      freshness = "mock";
    }

    const response: ApiResponse<{ typhoons: Typhoon[]; earthquakes: Earthquake[]; volcanoes: VolcanoStatus[] }> = {
      data: { typhoons, earthquakes, volcanoes },
      meta: { freshness, timestamp: new Date().toISOString() },
    };
    return response;
  });
}
