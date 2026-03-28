import { PH_CITIES, type CityConfig } from "../config/cities.js";

export interface ExtractedLocation {
  regionId: string;
  lat: number;
  lon: number;
  cityName: string;
}

export function extractLocation(title: string): ExtractedLocation | null {
  const lower = title.toLowerCase();

  for (const city of PH_CITIES) {
    for (const keyword of city.keywords) {
      const kw = keyword.toLowerCase();
      const idx = lower.indexOf(kw);
      if (idx === -1) continue;

      const before = idx > 0 ? lower[idx - 1] : " ";
      const after = idx + kw.length < lower.length ? lower[idx + kw.length] : " ";
      const boundary = /[\s,.\-:;!?'"()\/]/;

      if ((idx === 0 || boundary.test(before)) && (idx + kw.length === lower.length || boundary.test(after))) {
        return {
          regionId: city.id,
          lat: city.lat,
          lon: city.lon,
          cityName: city.name,
        };
      }
    }
  }
  return null;
}

export function getCityById(id: string): CityConfig | undefined {
  return PH_CITIES.find((c) => c.id === id);
}
