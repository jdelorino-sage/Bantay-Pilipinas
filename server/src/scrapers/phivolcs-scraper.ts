import * as cheerio from "cheerio";
import { CircuitBreaker } from "../services/circuit-breaker.js";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";

const eqBreaker = new CircuitBreaker("phivolcs-eq", 3, 120_000);
const volcanoBreaker = new CircuitBreaker("phivolcs-volcano", 3, 120_000);

const PHIVOLCS_EQ_URL = "https://earthquake.phivolcs.dost.gov.ph/";

interface StoredEarthquake {
  id: number;
  magnitude: number;
  depthKm: number | null;
  lat: number;
  lon: number;
  locationText: string | null;
  intensity: number | null;
  tsunamiAdvisory: boolean;
  source: string;
  occurredAt: string;
}

interface StoredVolcano {
  id: string;
  name: string;
  lat: number;
  lon: number;
  alertLevel: number;
  alertDescription: string | null;
  observations: string[];
  lastBulletinAt: string | null;
}

const memoryEarthquakes: StoredEarthquake[] = [];
const memoryVolcanoes = new Map<string, StoredVolcano>();
let nextEqId = 1;

export async function scrapePHIVOLCS(): Promise<number> {
  if (!eqBreaker.canExecute()) return 0;

  let count = 0;
  try {
    const response = await fetch(PHIVOLCS_EQ_URL, {
      headers: { "User-Agent": "BantayPilipinas/1.0 (Philippine Monitor)" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("table tbody tr").each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length < 5) return;

      const dateTimeText = $(cells[0]).text().trim();
      const latText = $(cells[1]).text().trim();
      const lonText = $(cells[2]).text().trim();
      const depthText = $(cells[3]).text().trim();
      const magText = $(cells[4]).text().trim();
      const locationText = cells.length > 5 ? $(cells[5]).text().trim() : null;

      const magnitude = parseFloat(magText);
      const lat = parseFloat(latText);
      const lon = parseFloat(lonText);
      const depthKm = parseFloat(depthText);

      if (isNaN(magnitude) || isNaN(lat) || isNaN(lon)) return;

      const parsedDate = new Date(dateTimeText);
      if (isNaN(parsedDate.getTime())) return;
      const occurredAt = parsedDate.toISOString();

      const eq: StoredEarthquake = {
        id: nextEqId++,
        magnitude,
        depthKm: isNaN(depthKm) ? null : depthKm,
        lat,
        lon,
        locationText: locationText || null,
        intensity: null,
        tsunamiAdvisory: false,
        source: "phivolcs",
        occurredAt,
      };

      if (hasDatabaseUrl()) {
        query(
          `INSERT INTO ${TABLES.EARTHQUAKES}
           (magnitude, depth_km, lat, lon, location_text, intensity, tsunami_advisory, source, occurred_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`,
          [eq.magnitude, eq.depthKm, eq.lat, eq.lon, eq.locationText, eq.intensity, eq.tsunamiAdvisory, eq.source, eq.occurredAt]
        ).catch((err: unknown) => console.error("[phivolcs] DB insert failed:", (err as Error).message));
      } else {
        const exists = memoryEarthquakes.some(
          (e) => e.magnitude === eq.magnitude && e.occurredAt === eq.occurredAt && e.lat === eq.lat
        );
        if (!exists) {
          memoryEarthquakes.unshift(eq);
          if (memoryEarthquakes.length > 200) memoryEarthquakes.pop();
        }
      }
      count++;
    });

    eqBreaker.recordSuccess();
    console.log(`[phivolcs] Scraped ${count} earthquakes`);
  } catch (err) {
    eqBreaker.recordFailure();
    console.error("[phivolcs] Earthquake scrape failed:", (err as Error).message);
  }
  return count;
}

export async function scrapeVolcanoStatus(): Promise<number> {
  if (!volcanoBreaker.canExecute()) return 0;

  try {
    const response = await fetch("https://www.phivolcs.dost.gov.ph/index.php/volcano-hazard/volcano-bulletin2", {
      headers: { "User-Agent": "BantayPilipinas/1.0 (Philippine Monitor)" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let count = 0;
    $("table tbody tr, .volcano-status tr").each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      const name = $(cells[0]).text().trim();
      const alertText = $(cells[1]).text().trim();
      const description = $(cells[2]).text().trim();

      if (!name) return;

      const alertLevel = parseInt(alertText, 10);
      if (isNaN(alertLevel)) return;

      const id = name.toLowerCase().replace(/\s+/g, "-");

      if (hasDatabaseUrl()) {
        query(
          `UPDATE ${TABLES.VOLCANO_STATUS} SET alert_level = $1, alert_description = $2, last_bulletin_at = NOW() WHERE id = $3`,
          [alertLevel, description, id]
        ).catch((err: unknown) => console.error("[phivolcs] Volcano DB update failed:", (err as Error).message));
      } else {
        const existing = memoryVolcanoes.get(id);
        if (existing) {
          existing.alertLevel = alertLevel;
          existing.alertDescription = description || null;
          existing.lastBulletinAt = new Date().toISOString();
        } else {
          memoryVolcanoes.set(id, {
            id, name, lat: 0, lon: 0,
            alertLevel, alertDescription: description || null,
            observations: [], lastBulletinAt: new Date().toISOString(),
          });
        }
      }
      count++;
    });

    volcanoBreaker.recordSuccess();
    console.log(`[phivolcs] Scraped ${count} volcano statuses`);
    return count;
  } catch (err) {
    volcanoBreaker.recordFailure();
    console.error("[phivolcs] Volcano status scrape failed:", (err as Error).message);
    return 0;
  }
}

export async function getStoredEarthquakes(limit = 20): Promise<StoredEarthquake[]> {
  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT id, magnitude, depth_km as "depthKm", lat, lon, location_text as "locationText",
                intensity, tsunami_advisory as "tsunamiAdvisory", source, occurred_at as "occurredAt"
         FROM ${TABLES.EARTHQUAKES}
         ORDER BY occurred_at DESC LIMIT $1`,
        [limit]
      );
      return result.rows as StoredEarthquake[];
    } catch (err) {
      console.error("[phivolcs] DB query failed:", (err as Error).message);
    }
  }
  return memoryEarthquakes.slice(0, limit);
}

export async function getStoredVolcanoes(): Promise<StoredVolcano[]> {
  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT id, name, lat, lon, alert_level as "alertLevel",
                alert_description as "alertDescription", observations,
                last_bulletin_at as "lastBulletinAt"
         FROM ${TABLES.VOLCANO_STATUS}
         ORDER BY alert_level DESC`
      );
      return result.rows as StoredVolcano[];
    } catch (err) {
      console.error("[phivolcs] Volcano DB query failed:", (err as Error).message);
    }
  }
  return Array.from(memoryVolcanoes.values());
}
