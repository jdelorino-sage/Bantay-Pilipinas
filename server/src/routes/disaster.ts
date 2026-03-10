import type { FastifyInstance } from "fastify";
import type { ApiResponse, Typhoon, Earthquake, VolcanoStatus } from "@bantay-pilipinas/shared";
import { getStoredEarthquakes, getStoredVolcanoes } from "../scrapers/phivolcs-scraper.js";
import { getStoredTyphoons, getStoredAdvisories } from "../scrapers/pagasa-scraper.js";
import type { WeatherAdvisory } from "../scrapers/pagasa-scraper.js";

export function registerDisasterRoutes(app: FastifyInstance): void {
  app.get("/api/disaster", async () => {
    let freshness = "live";

    let earthquakes: Earthquake[];
    try {
      const scraped = await getStoredEarthquakes(20);
      earthquakes = scraped as unknown as Earthquake[];
      if (scraped.length === 0) freshness = "empty";
    } catch {
      earthquakes = [];
      freshness = "error";
    }

    let volcanoes: VolcanoStatus[];
    try {
      const scraped = await getStoredVolcanoes();
      volcanoes = scraped as unknown as VolcanoStatus[];
    } catch {
      volcanoes = [];
      freshness = "error";
    }

    let typhoons: Typhoon[];
    try {
      const scraped = await getStoredTyphoons();
      typhoons = scraped as unknown as Typhoon[];
    } catch {
      typhoons = [];
      freshness = "error";
    }

    let weatherAdvisories: WeatherAdvisory[];
    try {
      weatherAdvisories = await getStoredAdvisories();
    } catch {
      weatherAdvisories = [];
    }

    const response: ApiResponse<{
      typhoons: Typhoon[];
      earthquakes: Earthquake[];
      volcanoes: VolcanoStatus[];
      weatherAdvisories: WeatherAdvisory[];
    }> = {
      data: { typhoons, earthquakes, volcanoes, weatherAdvisories },
      meta: { freshness, timestamp: new Date().toISOString() },
    };
    return response;
  });
}
