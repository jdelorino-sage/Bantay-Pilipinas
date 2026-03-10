import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@bantay-pilipinas/shared";
import { LRUCache } from "../services/cache.js";
import { CircuitBreaker } from "../services/circuit-breaker.js";

interface MilitaryFlight {
  icao24: string;
  callsign: string | null;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  classification: string;
  lastSeen: string;
}

const cache = new LRUCache<MilitaryFlight[]>(10);
const breaker = new CircuitBreaker("opensky", 3, 120_000);
const CACHE_TTL = 300_000;

const PH_BOX = { lamin: 4.5, lamax: 21.5, lomin: 116.0, lomax: 127.0 };

const MILITARY_PREFIXES = [
  "CALI", "NAVY", "RCH", "JAKE", "EVAC", "SAM", "EXEC",
  "CNV", "PAF", "AFP",
];

function classifyFlight(callsign: string | null): string {
  if (!callsign) return "unknown";
  const cs = callsign.trim().toUpperCase();
  if (cs.startsWith("PAF") || cs.startsWith("AFP")) return "ph-military";
  for (const prefix of MILITARY_PREFIXES) {
    if (cs.startsWith(prefix)) return "military";
  }
  return "unknown";
}

async function fetchFromOpenSky(): Promise<MilitaryFlight[]> {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return [];
  if (!breaker.canExecute()) return [];

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${PH_BOX.lamin}&lomin=${PH_BOX.lomin}&lamax=${PH_BOX.lamax}&lomax=${PH_BOX.lomax}`;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`OpenSky HTTP ${res.status}`);
    }

    const data = await res.json() as { states: (string | number | boolean | null)[][] | null };
    breaker.recordSuccess();

    if (!data.states) return [];

    const flights: MilitaryFlight[] = [];
    for (const s of data.states) {
      const callsign = s[1] as string | null;
      const classification = classifyFlight(callsign);
      if (classification === "unknown") continue;

      const lon = s[5] as number | null;
      const lat = s[6] as number | null;
      if (lat == null || lon == null) continue;

      flights.push({
        icao24: s[0] as string,
        callsign: callsign?.trim() || null,
        lat,
        lon,
        altitude: (s[7] as number) || 0,
        heading: (s[10] as number) || 0,
        classification,
        lastSeen: new Date(((s[4] as number) || 0) * 1000).toISOString(),
      });
    }

    return flights;
  } catch (err) {
    breaker.recordFailure();
    console.error("[military] OpenSky fetch failed:", (err as Error).message);
    return [];
  }
}

export function registerMilitaryRoutes(app: FastifyInstance): void {
  app.get("/api/military", async () => {
    const cached = cache.get("military:flights");
    if (cached) {
      const response: ApiResponse<MilitaryFlight[]> = {
        data: cached,
        meta: { freshness: "cached", timestamp: new Date().toISOString() },
      };
      return response;
    }

    const flights = await fetchFromOpenSky();
    if (flights.length > 0) {
      cache.set("military:flights", flights, CACHE_TTL);
    }

    const response: ApiResponse<MilitaryFlight[]> = {
      data: flights,
      meta: { freshness: flights.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
    };
    return response;
  });
}
