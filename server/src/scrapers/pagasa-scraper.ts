import * as cheerio from "cheerio";
import { CircuitBreaker } from "../services/circuit-breaker.js";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";

const breaker = new CircuitBreaker("pagasa", 3, 120_000);

const PAGASA_TC_URL = "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";

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

const memoryTyphoons = new Map<string, StoredTyphoon>();

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

    if (localName) {
      const coords = extractCoordinates(bulletinText);
      const windKph = extractWindSpeed(bulletinText);
      const id = localName.toLowerCase();

      const typhoon: StoredTyphoon = {
        id,
        internationalName,
        localName,
        lat: coords?.lat || 0,
        lon: coords?.lon || 0,
        maxWindKph: windKph,
        signalAreas: {},
        forecastTrack: [],
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
             impact_score = EXCLUDED.impact_score,
             is_active = true, updated_at = NOW()`,
          [id, internationalName, localName, typhoon.lat, typhoon.lon, windKph,
           JSON.stringify(typhoon.signalAreas), JSON.stringify(typhoon.forecastTrack),
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
