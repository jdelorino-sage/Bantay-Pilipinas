import {
  NewsCategory,
  SourceTier,
  VesselClassification,
  StabilityLevel,
  RegionId,
} from "@bantay-pilipinas/shared";
import type {
  ApiResponse,
  NewsArticle,
  TrackedVessel,
  WPSIncident,
  WPSTensionScore,
  Typhoon,
  Earthquake,
  VolcanoStatus,
  EconomicDataPoint,
  RegionalStabilityScore,
  AISummary,
  HealthResponse,
} from "@bantay-pilipinas/shared";

const API_BASE = import.meta.env.VITE_API_URL || "";

function fallbackMeta(): { freshness: string; timestamp: string } {
  return { freshness: "fallback", timestamp: new Date().toISOString() };
}

const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: 1,
    urlHash: "fb1",
    title: "DFA files diplomatic protest over latest WPS incident",
    url: "#",
    source: "Philippine News Agency",
    sourceTier: SourceTier.WireGov,
    category: NewsCategory.WPSMaritime,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: ["DFA", "WPS"],
    sentiment: "negative",
  },
  {
    id: 2,
    urlHash: "fb2",
    title: "PSEi closes higher on foreign fund inflows",
    url: "#",
    source: "BusinessWorld",
    sourceTier: SourceTier.MajorNational,
    category: NewsCategory.Economy,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: ["PSE"],
    sentiment: "positive",
  },
  {
    id: 3,
    urlHash: "fb3",
    title: "PAGASA: Southwest monsoon to bring rain over Western Luzon",
    url: "#",
    source: "Inquirer.net",
    sourceTier: SourceTier.MajorNational,
    category: NewsCategory.Disaster,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: ["PAGASA"],
    sentiment: "neutral",
  },
  {
    id: 4,
    urlHash: "fb4",
    title: "AFP deploys additional assets to Ayungin Shoal resupply mission",
    url: "#",
    source: "Rappler",
    sourceTier: SourceTier.MajorNational,
    category: NewsCategory.Defense,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: ["AFP", "Ayungin"],
    sentiment: "neutral",
  },
  {
    id: 5,
    urlHash: "fb5",
    title: "OFW remittances reach $2.8B in latest monthly report",
    url: "#",
    source: "Manila Bulletin",
    sourceTier: SourceTier.MajorNational,
    category: NewsCategory.Economy,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: ["BSP", "OFW"],
    sentiment: "positive",
  },
];

const FALLBACK_WPS_TENSION: WPSTensionScore = {
  score: 42.5,
  components: { vesselIntrusions: 55, diplomaticSignals: 30, militaryActivity: 45, newsVelocity: 35 },
  level: StabilityLevel.Elevated,
  trend: "stable",
  computedAt: new Date().toISOString(),
};

const FALLBACK_VESSELS: TrackedVessel[] = [
  {
    mmsi: 412000001,
    name: "CCG 5901",
    classification: VesselClassification.CCG,
    flagState: "CN",
    lat: 15.12,
    lon: 117.75,
    heading: 180,
    speed: 5.2,
    inEez: true,
    nearFeature: "Scarborough Shoal",
    recordedAt: new Date().toISOString(),
  },
];

const FALLBACK_DISASTER: { typhoons: Typhoon[]; earthquakes: Earthquake[]; volcanoes: VolcanoStatus[] } = {
  typhoons: [],
  earthquakes: [
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
  ],
  volcanoes: [
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
  ],
};

const FALLBACK_MARKET: EconomicDataPoint[] = [
  { id: 1, indicator: "PSEi", value: 6842.5, currency: "PHP", source: "pse", recordedAt: new Date().toISOString() },
  { id: 2, indicator: "USD/PHP", value: 56.85, currency: "PHP", source: "bsp", recordedAt: new Date().toISOString() },
  { id: 3, indicator: "BSP Rate", value: 6.25, currency: "PHP", source: "bsp", recordedAt: new Date().toISOString() },
  { id: 4, indicator: "Inflation", value: 3.7, currency: "PHP", source: "bsp", recordedAt: new Date().toISOString() },
  { id: 5, indicator: "Remittances", value: 2800, currency: "USD", source: "bsp", recordedAt: new Date().toISOString() },
];

const FALLBACK_RISK_SCORES: { regions: RegionalStabilityScore[]; wpsTension: WPSTensionScore } = {
  regions: [
    { regionId: RegionId.NCR, score: 22.5, components: { baselineRisk: 15, unrest: 25, security: 20, information: 30 }, boosts: {}, level: StabilityLevel.Guarded, trend: "stable", computedAt: new Date().toISOString() },
    { regionId: RegionId.BARMM, score: 45.0, components: { baselineRisk: 40, unrest: 50, security: 48, information: 40 }, boosts: {}, level: StabilityLevel.Elevated, trend: "stable", computedAt: new Date().toISOString() },
    { regionId: RegionId.WPS, score: 42.5, components: { baselineRisk: 35, unrest: 0, security: 55, information: 45 }, boosts: {}, level: StabilityLevel.Elevated, trend: "rising", computedAt: new Date().toISOString() },
    { regionId: RegionId.CAR, score: 28.0, components: { baselineRisk: 25, unrest: 30, security: 28, information: 30 }, boosts: {}, level: StabilityLevel.Guarded, trend: "falling", computedAt: new Date().toISOString() },
    { regionId: RegionId.EVBicol, score: 25.0, components: { baselineRisk: 20, unrest: 15, security: 22, information: 40 }, boosts: {}, level: StabilityLevel.Guarded, trend: "stable", computedAt: new Date().toISOString() },
  ],
  wpsTension: FALLBACK_WPS_TENSION,
};

const FALLBACKS: Record<string, ApiResponse<unknown>> = {
  "/api/news": { data: FALLBACK_NEWS, meta: fallbackMeta() },
  "/api/wps": { data: FALLBACK_VESSELS, meta: fallbackMeta() },
  "/api/wps/incidents": { data: [], meta: fallbackMeta() },
  "/api/wps/tension": { data: FALLBACK_WPS_TENSION, meta: fallbackMeta() },
  "/api/disaster": { data: FALLBACK_DISASTER, meta: fallbackMeta() },
  "/api/market": { data: FALLBACK_MARKET, meta: fallbackMeta() },
  "/api/risk-scores": { data: FALLBACK_RISK_SCORES, meta: fallbackMeta() },
  "/api/risk-scores/history": { data: [], meta: fallbackMeta() },
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  if (init?.body) {
    headers["Content-Type"] = "application/json";
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers, ...init });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON but got ${contentType}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[api] ${path}:`, err);
    const basePath = path.split("?")[0];
    const fallback = FALLBACKS[basePath];
    if (fallback) {
      return { ...fallback, meta: fallbackMeta() } as ApiResponse<T>;
    }
    throw err;
  }
}

export class ApiClient {
  async getNews(category?: string): Promise<ApiResponse<NewsArticle[]>> {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    return fetchJson(`/api/news${params}`);
  }

  async getWPSVessels(): Promise<ApiResponse<TrackedVessel[]>> {
    return fetchJson("/api/wps");
  }

  async getWPSIncidents(): Promise<ApiResponse<WPSIncident[]>> {
    return fetchJson("/api/wps/incidents");
  }

  async getWPSTension(): Promise<ApiResponse<WPSTensionScore>> {
    return fetchJson("/api/wps/tension");
  }

  async getDisaster(): Promise<ApiResponse<{ typhoons: Typhoon[]; earthquakes: Earthquake[]; volcanoes: VolcanoStatus[] }>> {
    return fetchJson("/api/disaster");
  }

  async getMarket(): Promise<ApiResponse<EconomicDataPoint[]>> {
    return fetchJson("/api/market");
  }

  async getRiskScores(): Promise<ApiResponse<{ regions: RegionalStabilityScore[]; wpsTension: WPSTensionScore }>> {
    return fetchJson("/api/risk-scores");
  }

  async getSummary(headlineIds: number[]): Promise<ApiResponse<AISummary>> {
    return fetchJson("/api/summarize", {
      method: "POST",
      body: JSON.stringify({ headlineIds }),
    });
  }

  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
  }
}
