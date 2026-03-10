import WebSocket from "ws";
import { PH_EEZ_BOUNDS, VesselClassification } from "@bantay-pilipinas/shared";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";
import { broadcastVesselUpdate } from "../ws/realtime.js";

interface AISMessage {
  mmsi: number;
  name?: string;
  lat: number;
  lon: number;
  heading?: number;
  speed?: number;
}

interface AISStreamMessage {
  MessageType: string;
  Message: {
    PositionReport?: {
      Latitude: number;
      Longitude: number;
      Cog: number;
      Sog: number;
      TrueHeading: number;
      NavigationalStatus: number;
    };
    ShipStaticData?: {
      Name: string;
      MmsiCountryCode: string;
    };
  };
  MetaData: {
    MMSI: number;
    ShipName: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
}

type VesselHandler = (vessel: AISMessage) => void;

function isInEEZ(lat: number, lon: number): boolean {
  return (
    lat >= PH_EEZ_BOUNDS.south &&
    lat <= PH_EEZ_BOUNDS.north &&
    lon >= PH_EEZ_BOUNDS.west &&
    lon <= PH_EEZ_BOUNDS.east
  );
}

function findNearFeature(lat: number, lon: number): string | null {
  const features = [
    { name: "Scarborough Shoal", lat: 15.15, lon: 117.76, radiusDeg: 0.5 },
    { name: "Ayungin Shoal", lat: 9.75, lon: 115.87, radiusDeg: 0.3 },
    { name: "Pag-asa Island", lat: 11.05, lon: 114.28, radiusDeg: 0.3 },
    { name: "Panganiban Reef", lat: 9.90, lon: 115.53, radiusDeg: 0.3 },
    { name: "Recto Bank", lat: 11.45, lon: 116.85, radiusDeg: 0.5 },
  ];

  for (const f of features) {
    const dist = Math.sqrt(Math.pow(lat - f.lat, 2) + Math.pow(lon - f.lon, 2));
    if (dist <= f.radiusDeg) return f.name;
  }
  return null;
}

export class AISStreamClient {
  private ws: WebSocket | null = null;
  private handlers: Set<VesselHandler> = new Set();
  private apiKey: string | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 5_000;
  private maxReconnectDelay = 60_000;

  constructor() {
    this.apiKey = process.env.AISSTREAM_API_KEY;
  }

  connect(): void {
    if (!this.apiKey) {
      console.log("[ais] No API key configured, skipping AIS stream");
      return;
    }

    this.doConnect();
  }

  private doConnect(): void {
    if (!this.apiKey) return;

    try {
      this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      this.ws.on("open", () => {
        console.log("[ais] Connected to AISStream");
        this.reconnectDelay = 5_000;

        const subscribeMsg = JSON.stringify({
          APIKey: this.apiKey,
          BoundingBoxes: [
            [
              [PH_EEZ_BOUNDS.south, PH_EEZ_BOUNDS.west],
              [PH_EEZ_BOUNDS.north, PH_EEZ_BOUNDS.east],
            ],
          ],
        });
        this.ws?.send(subscribeMsg);
      });

      this.ws.on("message", (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString()) as AISStreamMessage;
          this.handleMessage(msg);
        } catch {
          // Ignore parse errors
        }
      });

      this.ws.on("close", () => {
        console.log("[ais] WebSocket closed, scheduling reconnect");
        this.scheduleReconnect();
      });

      this.ws.on("error", (err) => {
        console.error("[ais] WebSocket error:", err.message);
        this.ws?.close();
      });
    } catch (err) {
      console.error("[ais] Connection failed:", (err as Error).message);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    console.log(`[ais] Reconnecting in ${this.reconnectDelay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.doConnect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  private handleMessage(msg: AISStreamMessage): void {
    const mmsi = msg.MetaData.MMSI;
    const lat = msg.MetaData.latitude;
    const lon = msg.MetaData.longitude;
    const name = msg.MetaData.ShipName || msg.Message?.ShipStaticData?.Name || null;

    if (!mmsi || lat == null || lon == null) return;
    if (!isInEEZ(lat, lon)) return;

    const posReport = msg.Message?.PositionReport;
    const vessel: AISMessage = {
      mmsi,
      name: name || undefined,
      lat,
      lon,
      heading: posReport?.TrueHeading ?? posReport?.Cog ?? undefined,
      speed: posReport?.Sog ?? undefined,
    };

    for (const handler of this.handlers) {
      try {
        handler(vessel);
      } catch {
        // Ignore handler errors
      }
    }

    const inEez = isInEEZ(lat, lon);
    const nearFeature = findNearFeature(lat, lon);

    broadcastVesselUpdate({
      mmsi,
      name,
      classification: VesselClassification.Unknown,
      lat,
      lon,
      heading: vessel.heading,
      speed: vessel.speed,
      inEez,
      nearFeature,
      recordedAt: msg.MetaData.time_utc || new Date().toISOString(),
    });

    if (hasDatabaseUrl()) {
      query(
        `INSERT INTO ${TABLES.VESSEL_TRACKS}
         (mmsi, name, classification, flag_state, lat, lon, heading, speed, in_eez, near_feature, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [mmsi, name, VesselClassification.Unknown, null, lat, lon, vessel.heading || null, vessel.speed || null, inEez, nearFeature]
      ).catch((err: unknown) => console.error("[ais] DB insert failed:", (err as Error).message));
    }
  }

  onVessel(handler: VesselHandler): void {
    this.handlers.add(handler);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
