import * as cheerio from "cheerio";
import { CircuitBreaker } from "../services/circuit-breaker.js";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";

const breaker = new CircuitBreaker("pagasa", 3, 120_000);

const PAGASA_TC_URL = "https://bagong.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";
const PAGASA_WEATHER_URL = "https://bagong.pagasa.dost.gov.ph/weather";

const weatherBreaker = new CircuitBreaker("pagasa-weather", 3, 120_000);

interface StoredTyphoon {
  id: string;
  internationalName: string | null;
  localName: string | null;
  lat: number;
  lon: number;
  maxWindKph: number | null;
  signalAreas: Record<string, number>;
  forecastTrack: Array<{ lat: number; lon: number; timestamp: string; windKph: number | null }>;
  impactScore: number;
  isActive: boolean;
  updatedAt: string;
}

export interface WeatherAdvisory {
  id: string;
  type: "lpa" | "monsoon" | "itcz" | "shearline" | "ridge" | "general";
  title: string;
  description: string;
  lat: number | null;
  lon: number | null;
  affectedAreas: string[];
  isActive: boolean;
  updatedAt: string;
}

const memoryTyphoons = new Map<string, StoredTyphoon>();
const memoryAdvisories = new Map<string, WeatherAdvisory>();

function extractCoordinates(text: string): { lat: number; lon: number } | null {
  const match = text.match(/([\d.]+)\s*°?\s*N[,\s]+([\d.]+)\s*°?\s*E/i);
  if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
  return null;
}

function extractWindSpeed(text: string): number | null {
  const kphMatch = text.match(/([\d]+)\s*(?:kph|km\/h)/i);
  if (kphMatch) return parseInt(kphMatch[1], 10);
  const ktsMatch = text.match(/([\d]+)\s*(?:kts?|knots?)/i);
  if (ktsMatch) return Math.round(parseInt(ktsMatch[1], 10) * 1.852);
  return null;
}

function extractForecastTrack(text: string): Array<{ lat: number; lon: number; timestamp: string; windKph: number | null }> {
  const track: Array<{ lat: number; lon: number; timestamp: string; windKph: number | null }> = [];
  const forecastPattern = /(?:(?:by|at|on)\s+)?(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}:\d{2}\s*(?:AM|PM)\s+(?:tomorrow|today|\w+)).*?([\d.]+)\s*°?\s*N[,\s]+([\d.]+)\s*°?\s*E.*?(?:([\d]+)\s*(?:kph|km\/h))?/gi;
  let match: RegExpExecArray | null;
  while ((match = forecastPattern.exec(text)) !== null) {
    const lat = parseFloat(match[2]);
    const lon = parseFloat(match[3]);
    if (lat < 3 || lat > 25 || lon < 110 || lon > 140) continue;
    const windKph = match[4] ? parseInt(match[4], 10) : null;
    const dateStr = match[1].trim();
    let timestamp: string;
    try {
      const parsed = new Date(dateStr);
      timestamp = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    } catch {
      timestamp = new Date().toISOString();
    }
    track.push({ lat, lon, timestamp, windKph });
  }

  const hourPattern = /(?:(\d{2,4})\s*(?:H|hrs?|hours?))[^.]*?([\d.]+)\s*°?\s*N[,\s]+([\d.]+)\s*°?\s*E/gi;
  while ((match = hourPattern.exec(text)) !== null) {
    const lat = parseFloat(match[2]);
    const lon = parseFloat(match[3]);
    if (lat < 3 || lat > 25 || lon < 110 || lon > 140) continue;
    const hoursAhead = parseInt(match[1], 10);
    const ts = new Date(Date.now() + hoursAhead * 3600_000).toISOString();
    track.push({ lat, lon, timestamp: ts, windKph: null });
  }

  return track;
}

function computeImpactScore(windKph: number | null): number {
  if (!windKph) return 10;
  if (windKph >= 220) return 95;
  if (windKph >= 185) return 80;
  if (windKph >= 150) return 65;
  if (windKph >= 118) return 50;
  if (windKph >= 89) return 35;
  if (windKph >= 62) return 20;
  return 10;
}

export async function scrapePAGASA(): Promise<number> {
  if (!breaker.canExecute()) return 0;

  try {
    const response = await fetch(PAGASA_TC_URL, {
      headers: { "User-Agent": "BantayPilipinas/1.0 (Philippine Monitor)" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        breaker.recordSuccess();
        console.log("[pagasa] No active tropical cyclone bulletin (404)");
        return 0;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const bodyText = $("body").text();

    if (bodyText.includes("NO TROPICAL CYCLONE") || bodyText.includes("no active tropical cyclone")) {
      breaker.recordSuccess();
      if (hasDatabaseUrl()) {
        await query(`UPDATE ${TABLES.TYPHOONS} SET is_active = false WHERE is_active = true`).catch(() => {});
      } else {
        for (const t of memoryTyphoons.values()) t.isActive = false;
      }
      console.log("[pagasa] No active tropical cyclones");
      return 0;
    }

    let count = 0;

    const bulletinText = $(".field-item, .bulletin-content, article, .content").text();

    const nameMatch = bulletinText.match(/(?:Typhoon|Tropical Storm|Tropical Depression|Super Typhoon)\s+"?(\w+)"?\s*(?:\((\w+)\))?/i);
    const localName = nameMatch ? nameMatch[1] : null;
    const internationalName = nameMatch && nameMatch[2] ? nameMatch[2] : null;

    if (!localName) {
      const lpaInBulletin = bulletinText.match(/(?:Low Pressure Area|LPA)/i);
      if (lpaInBulletin) {
        const coords = extractCoordinates(bulletinText);
        const windKph = extractWindSpeed(bulletinText);
        const id = `lpa-bulletin-${new Date().toISOString().slice(0, 10)}`;
        const typhoon: StoredTyphoon = {
          id,
          internationalName: null,
          localName: "LPA",
          lat: coords?.lat || 0,
          lon: coords?.lon || 0,
          maxWindKph: windKph,
          signalAreas: {},
          forecastTrack: [],
          impactScore: computeImpactScore(windKph),
          isActive: true,
          updatedAt: new Date().toISOString(),
        };

        if (hasDatabaseUrl()) {
          await query(
            `INSERT INTO ${TABLES.TYPHOONS}
             (id, international_name, local_name, lat, lon, max_wind_kph, signal_areas, forecast_track, impact_score, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             ON CONFLICT (id) DO UPDATE SET
               lat = EXCLUDED.lat, lon = EXCLUDED.lon,
               max_wind_kph = EXCLUDED.max_wind_kph,
               is_active = true, updated_at = NOW()`,
            [id, null, "LPA", typhoon.lat, typhoon.lon, windKph,
             JSON.stringify({}), JSON.stringify([]),
             typhoon.impactScore, true]
          ).catch((err: unknown) => console.error("[pagasa] LPA DB upsert failed:", (err as Error).message));
        } else {
          memoryTyphoons.set(id, typhoon);
        }
        count++;
      }
    }

    if (localName) {
      const coords = extractCoordinates(bulletinText);
      const windKph = extractWindSpeed(bulletinText);
      const id = localName.toLowerCase();

      const forecastTrack = extractForecastTrack(bulletinText);

      const typhoon: StoredTyphoon = {
        id,
        internationalName,
        localName,
        lat: coords?.lat || 0,
        lon: coords?.lon || 0,
        maxWindKph: windKph,
        signalAreas: {},
        forecastTrack,
        impactScore: computeImpactScore(windKph),
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      for (let signal = 5; signal >= 1; signal--) {
        const signalRegex = new RegExp(`Signal\\s*(?:No\\.?|#)\\s*${signal}[:\\s]+([^.]+)\\.`, "i");
        const signalMatch = bulletinText.match(signalRegex);
        if (signalMatch) {
          const provinces = signalMatch[1].split(",").map((p) => p.trim()).filter(Boolean);
          for (const province of provinces) {
            typhoon.signalAreas[province] = signal;
          }
        }
      }

      if (hasDatabaseUrl()) {
        await query(
          `INSERT INTO ${TABLES.TYPHOONS}
           (id, international_name, local_name, lat, lon, max_wind_kph, signal_areas, forecast_track, impact_score, is_active, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
           ON CONFLICT (id) DO UPDATE SET
             lat = EXCLUDED.lat, lon = EXCLUDED.lon,
             max_wind_kph = EXCLUDED.max_wind_kph,
             signal_areas = EXCLUDED.signal_areas,
             forecast_track = EXCLUDED.forecast_track,
             impact_score = EXCLUDED.impact_score,
             is_active = true, updated_at = NOW()`,
          [id, internationalName, localName, typhoon.lat, typhoon.lon, windKph,
           JSON.stringify(typhoon.signalAreas), JSON.stringify(forecastTrack),
           typhoon.impactScore, true]
        ).catch((err: unknown) => console.error("[pagasa] DB upsert failed:", (err as Error).message));
      } else {
        memoryTyphoons.set(id, typhoon);
      }
      count++;
    }

    breaker.recordSuccess();
    console.log(`[pagasa] Scraped ${count} typhoon bulletin(s)`);
    return count;
  } catch (err) {
    breaker.recordFailure();
    console.error("[pagasa] Scrape failed:", (err as Error).message);
    return 0;
  }
}

export async function getStoredTyphoons(activeOnly = true): Promise<StoredTyphoon[]> {
  if (hasDatabaseUrl()) {
    try {
      let sql = `SELECT id, international_name as "internationalName", local_name as "localName",
                        lat, lon, max_wind_kph as "maxWindKph",
                        signal_areas as "signalAreas", forecast_track as "forecastTrack",
                        impact_score as "impactScore", is_active as "isActive",
                        updated_at as "updatedAt"
                 FROM ${TABLES.TYPHOONS}`;
      if (activeOnly) sql += ` WHERE is_active = true`;
      sql += ` ORDER BY updated_at DESC`;
      const result = await query(sql);
      return result.rows as StoredTyphoon[];
    } catch (err) {
      console.error("[pagasa] DB query failed:", (err as Error).message);
    }
  }

  let typhoons = Array.from(memoryTyphoons.values());
  if (activeOnly) typhoons = typhoons.filter((t) => t.isActive);
  return typhoons;
}

function extractLPACoordinates(text: string): { lat: number; lon: number } | null {
  const patterns = [
    /([\d.]+)\s*°?\s*N[,\s]+([\d.]+)\s*°?\s*E/i,
    /approximately\s+([\d.]+)\s*km\s+(\w+)\s+of\s+(\w+)/i,
    /located\s+(?:at\s+)?([\d.]+)\s*°?\s*N\s*,?\s*([\d.]+)\s*°?\s*E/i,
  ];
  for (const pat of patterns) {
    const match = text.match(pat);
    if (match && parseFloat(match[1]) > 0 && parseFloat(match[2]) > 100) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }
  }
  return null;
}

function extractAffectedAreas(text: string): string[] {
  const areaPatterns = [
    /(?:affect(?:ing|ed)?|rain(?:fall)?\s+(?:over|in)|thunderstorm\w*\s+(?:over|in))\s+([^.]+)/gi,
    /(?:Luzon|Visayas|Mindanao|Metro Manila|NCR|Palawan|Bicol|Eastern Visayas|Western Visayas|Central Luzon|CALABARZON|MIMAROPA|Cagayan Valley|Ilocos|CAR|Davao|SOCCSKSARGEN|Zamboanga|Caraga|BARMM)/gi,
  ];
  const areas = new Set<string>();
  for (const pat of areaPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pat.exec(text)) !== null) {
      const area = match[1] || match[0];
      areas.add(area.trim().replace(/[,.]$/, ""));
    }
  }
  return Array.from(areas).slice(0, 20);
}

export async function scrapeWeatherAdvisories(): Promise<number> {
  if (!weatherBreaker.canExecute()) return 0;

  try {
    const response = await fetch(PAGASA_WEATHER_URL, {
      headers: { "User-Agent": "BantayPilipinas/1.0 (Philippine Monitor)" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const bodyText = $("body").text();

    let count = 0;
    const now = new Date().toISOString();

    const lpaPattern = /(?:Low Pressure Area|LPA)[^.]*(?:\.|$)/gi;
    let lpaMatch: RegExpExecArray | null;
    let lpaIndex = 0;
    while ((lpaMatch = lpaPattern.exec(bodyText)) !== null) {
      const lpaText = lpaMatch[0];
      const coords = extractLPACoordinates(lpaText) || extractCoordinates(lpaText);
      const id = `lpa-${new Date().toISOString().slice(0, 10)}-${lpaIndex++}`;

      const advisory: WeatherAdvisory = {
        id,
        type: "lpa",
        title: `Low Pressure Area`,
        description: lpaText.trim(),
        lat: coords?.lat || null,
        lon: coords?.lon || null,
        affectedAreas: extractAffectedAreas(bodyText),
        isActive: true,
        updatedAt: now,
      };

      if (hasDatabaseUrl()) {
        await query(
          `INSERT INTO weather_advisories (id, type, title, description, lat, lon, affected_areas, is_active, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (id) DO UPDATE SET
             description = EXCLUDED.description, lat = EXCLUDED.lat, lon = EXCLUDED.lon,
             affected_areas = EXCLUDED.affected_areas, is_active = true, updated_at = NOW()`,
          [id, advisory.type, advisory.title, advisory.description,
           advisory.lat, advisory.lon, JSON.stringify(advisory.affectedAreas), true]
        ).catch((err: unknown) => console.error("[pagasa-weather] DB upsert failed:", (err as Error).message));
      } else {
        memoryAdvisories.set(id, advisory);
      }
      count++;
    }

    const weatherTypes = [
      { pattern: /monsoon[^.]*\./gi, type: "monsoon" as const },
      { pattern: /(?:ITCZ|intertropical convergence)[^.]*\./gi, type: "itcz" as const },
      { pattern: /shear\s*line[^.]*\./gi, type: "shearline" as const },
    ];

    for (const { pattern, type } of weatherTypes) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(bodyText)) !== null) {
        const text = match[0].trim();
        if (text.length < 20) continue;
        const id = `${type}-${now.slice(0, 10)}`;
        const advisory: WeatherAdvisory = {
          id,
          type,
          title: type === "monsoon" ? "Monsoon Advisory" : type === "itcz" ? "ITCZ Advisory" : "Shearline Advisory",
          description: text,
          lat: null,
          lon: null,
          affectedAreas: extractAffectedAreas(text),
          isActive: true,
          updatedAt: now,
        };

        if (hasDatabaseUrl()) {
          await query(
            `INSERT INTO weather_advisories (id, type, title, description, lat, lon, affected_areas, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (id) DO UPDATE SET
               description = EXCLUDED.description, affected_areas = EXCLUDED.affected_areas,
               is_active = true, updated_at = NOW()`,
            [id, type, advisory.title, advisory.description,
             advisory.lat, advisory.lon, JSON.stringify(advisory.affectedAreas), true]
          ).catch((err: unknown) => console.error("[pagasa-weather] DB upsert failed:", (err as Error).message));
        } else {
          memoryAdvisories.set(id, advisory);
        }
        count++;
        break;
      }
    }

    weatherBreaker.recordSuccess();
    console.log(`[pagasa-weather] Scraped ${count} weather advisory(ies)`);
    return count;
  } catch (err) {
    weatherBreaker.recordFailure();
    console.error("[pagasa-weather] Scrape failed:", (err as Error).message);
    return 0;
  }
}

export async function getStoredAdvisories(activeOnly = true): Promise<WeatherAdvisory[]> {
  if (hasDatabaseUrl()) {
    try {
      let sql = `SELECT id, type, title, description, lat, lon,
                        affected_areas as "affectedAreas",
                        is_active as "isActive",
                        updated_at as "updatedAt"
                 FROM weather_advisories`;
      if (activeOnly) sql += ` WHERE is_active = true`;
      sql += ` ORDER BY updated_at DESC`;
      const result = await query(sql);
      return result.rows as WeatherAdvisory[];
    } catch (err) {
      console.error("[pagasa-weather] DB query failed:", (err as Error).message);
    }
  }

  let advisories = Array.from(memoryAdvisories.values());
  if (activeOnly) advisories = advisories.filter((a) => a.isActive);
  return advisories;
}
