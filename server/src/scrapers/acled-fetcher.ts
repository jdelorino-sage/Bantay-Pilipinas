import { CircuitBreaker } from "../services/circuit-breaker.js";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";

const breaker = new CircuitBreaker("acled", 3, 300_000);

interface ACLEDEvent {
  data_id: number;
  event_type: string;
  sub_event_type: string;
  admin1: string;
  admin2: string;
  location: string;
  latitude: string;
  longitude: string;
  fatalities: string;
  notes: string;
  source: string;
  event_date: string;
}

const memoryEvents: ACLEDEvent[] = [];

export async function fetchACLED(): Promise<void> {
  const token = process.env.ACLED_ACCESS_TOKEN;
  if (!token) {
    console.log("[acled] No access token configured, skipping");
    return;
  }

  if (!breaker.canExecute()) return;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.acleddata.com/acled/read?key=${encodeURIComponent(token)}&email=bantaypilipinas@example.com&country=Philippines&event_date=${thirtyDaysAgo}|${today}&event_date_where=BETWEEN&limit=200`;

    const res = await fetch(url, {
      headers: { "User-Agent": "BantayPilipinas/1.0" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) throw new Error(`ACLED HTTP ${res.status}`);
    const json = await res.json() as { success: boolean; data: ACLEDEvent[] };

    if (!json.success || !Array.isArray(json.data)) {
      throw new Error("Invalid ACLED response");
    }

    breaker.recordSuccess();
    let stored = 0;

    for (const event of json.data) {
      const lat = parseFloat(event.latitude);
      const lon = parseFloat(event.longitude);
      if (isNaN(lat) || isNaN(lon)) continue;

      if (hasDatabaseUrl()) {
        await query(
          `INSERT INTO ${TABLES.CONFLICT_EVENTS}
           (acled_id, event_type, sub_event_type, location, lat, lon, fatalities, notes, source, event_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (acled_id) DO NOTHING`,
          [
            event.data_id,
            event.event_type,
            event.sub_event_type || null,
            `${event.location}, ${event.admin2}, ${event.admin1}`,
            lat, lon,
            parseInt(event.fatalities, 10) || 0,
            event.notes || null,
            event.source || null,
            event.event_date,
          ]
        ).catch((err: unknown) => console.error("[acled] DB insert failed:", (err as Error).message));
      } else {
        memoryEvents.push(event);
        if (memoryEvents.length > 500) memoryEvents.shift();
      }
      stored++;
    }

    console.log(`[acled] Fetched ${stored} conflict events (store: ${hasDatabaseUrl() ? "db" : "memory"})`);
  } catch (err) {
    breaker.recordFailure();
    console.error("[acled] Fetch failed:", (err as Error).message);
  }
}

export async function getConflictEventCount(): Promise<number> {
  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM ${TABLES.CONFLICT_EVENTS}
         WHERE event_date > NOW() - INTERVAL '30 days'`
      );
      return parseInt(result.rows[0]?.count || "0", 10);
    } catch {
      return 0;
    }
  }
  return memoryEvents.length;
}
