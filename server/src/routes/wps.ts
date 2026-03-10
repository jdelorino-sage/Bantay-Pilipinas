import type { FastifyInstance } from "fastify";
import type { ApiResponse, TrackedVessel, WPSIncident, WPSTensionScore } from "@bantay-pilipinas/shared";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";
import { computeWPSTension } from "../services/wps-tension-scorer.js";
import { LRUCache } from "../services/cache.js";

const cache = new LRUCache<unknown>(50);
const VESSEL_TTL = 30_000;
const TENSION_TTL = 60_000;

async function getVessels(): Promise<TrackedVessel[]> {
  const cached = cache.get("wps:vessels") as TrackedVessel[] | undefined;
  if (cached) return cached;

  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT mmsi, name, classification, flag_state AS "flagState",
                lat, lon, heading, speed, in_eez AS "inEez",
                near_feature AS "nearFeature", recorded_at AS "recordedAt"
         FROM ${TABLES.VESSEL_TRACKS}
         WHERE in_eez = true AND recorded_at > NOW() - INTERVAL '24 hours'
         ORDER BY recorded_at DESC
         LIMIT 200`
      );

      const deduped = new Map<number, TrackedVessel>();
      for (const row of result.rows) {
        if (!deduped.has(row.mmsi)) {
          deduped.set(row.mmsi, row as TrackedVessel);
        }
      }
      const vessels = Array.from(deduped.values());
      cache.set("wps:vessels", vessels, VESSEL_TTL);
      return vessels;
    } catch (err) {
      console.error("[wps] Failed to query vessels:", (err as Error).message);
    }
  }

  return [];
}

async function getIncidents(): Promise<WPSIncident[]> {
  const cached = cache.get("wps:incidents") as WPSIncident[] | undefined;
  if (cached) return cached;

  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT id, type, location, lat, lon, description, severity,
                vessels, detected_at AS "detectedAt", resolved_at AS "resolvedAt"
         FROM ${TABLES.WPS_INCIDENTS}
         WHERE detected_at > NOW() - INTERVAL '7 days'
         ORDER BY detected_at DESC
         LIMIT 50`
      );
      const incidents = result.rows.map((r: Record<string, unknown>) => ({
        ...r,
        vessels: Array.isArray(r.vessels) ? r.vessels : JSON.parse(String(r.vessels || "[]")),
      })) as WPSIncident[];
      cache.set("wps:incidents", incidents, TENSION_TTL);
      return incidents;
    } catch (err) {
      console.error("[wps] Failed to query incidents:", (err as Error).message);
    }
  }

  return [];
}

async function getTension(): Promise<WPSTensionScore> {
  const cached = cache.get("wps:tension") as WPSTensionScore | undefined;
  if (cached) return cached;

  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT score, components, level, trend, computed_at AS "computedAt"
         FROM ${TABLES.WPS_TENSION_SCORES}
         ORDER BY computed_at DESC LIMIT 1`
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const tension = {
          ...row,
          components: typeof row.components === "string" ? JSON.parse(row.components) : row.components,
        } as WPSTensionScore;
        cache.set("wps:tension", tension, TENSION_TTL);
        return tension;
      }
    } catch (err) {
      console.error("[wps] Failed to query tension score:", (err as Error).message);
    }
  }

  const tension = await computeWPSTension(0, 0, 0, 0);
  cache.set("wps:tension", tension, TENSION_TTL);
  return tension;
}

export function registerWPSRoutes(app: FastifyInstance): void {
  app.get("/api/wps", async () => {
    const vessels = await getVessels();
    const response: ApiResponse<TrackedVessel[]> = {
      data: vessels,
      meta: { freshness: vessels.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
    };
    return response;
  });

  app.get("/api/wps/incidents", async () => {
    const incidents = await getIncidents();
    const response: ApiResponse<WPSIncident[]> = {
      data: incidents,
      meta: { freshness: incidents.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
    };
    return response;
  });

  app.get("/api/wps/tension", async () => {
    const tension = await getTension();
    const response: ApiResponse<WPSTensionScore> = {
      data: tension,
      meta: { freshness: "live", timestamp: new Date().toISOString() },
    };
    return response;
  });
}
