import type {
  ApiResponse,
  NewsArticle,
  TrackedVessel,
  WPSIncident,
  WPSTensionScore,
  Typhoon,
  Earthquake,
  VolcanoStatus,
  WeatherAdvisory,
  EconomicDataPoint,
  RegionalStabilityScore,
  AISummary,
  HealthResponse,
} from "@bantay-pilipinas/shared";
import { getStabilityLevel, REGION_BASELINES, RegionId } from "@bantay-pilipinas/shared";

function normalizeBase(raw: string): string {
  let base = raw.trim().replace(/\/+$/, "");
  if (base && !base.startsWith("http")) {
    base = `https://${base}`;
  }
  return base;
}

const API_BASE = normalizeBase(import.meta.env.VITE_API_URL || "");

function emptyMeta(): { freshness: string; timestamp: string } {
  return { freshness: "offline", timestamp: new Date().toISOString() };
}

function liveMeta(): { freshness: string; timestamp: string } {
  return { freshness: "direct", timestamp: new Date().toISOString() };
}

async function attemptFetch<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  if (init?.body) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { headers, ...init });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType}`);
  }
  return await res.json();
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    return await attemptFetch<T>(`${API_BASE}${path}`, init);
  } catch (primaryErr) {
    if (API_BASE) {
      try {
        return await attemptFetch<T>(path, init);
      } catch { /* fall through */ }
    }
    console.warn(`[api] ${path}:`, primaryErr);
    throw primaryErr;
  }
}

async function fetchJsonWithFallback<T>(path: string, fallback: T, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    return await fetchJson<T>(path, init);
  } catch {
    return { data: fallback, meta: emptyMeta() };
  }
}

// ─── Direct data source fetching (client-side fallbacks) ───

interface RSS2JSONItem {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  description: string;
}

interface RSS2JSONResponse {
  status: string;
  feed: { title: string; url: string };
  items: RSS2JSONItem[];
}

const RSS2JSON_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";

const DIRECT_FEEDS = [
  { url: "https://news.google.com/rss/search?q=Philippines&hl=en-PH&gl=PH&ceid=PH:en", name: "Google News PH", category: "national-politics", tier: 4 },
  { url: "https://news.google.com/rss/search?q=%22West+Philippine+Sea%22&hl=en-PH&gl=PH&ceid=PH:en", name: "Google News WPS", category: "wps-maritime", tier: 4 },
  { url: "https://news.google.com/rss/search?q=typhoon+Philippines+PAGASA&hl=en-PH&gl=PH&ceid=PH:en", name: "Google News Typhoon", category: "disaster", tier: 4 },
  { url: "https://news.google.com/rss/search?q=Philippines+economy+peso+BSP&hl=en-PH&gl=PH&ceid=PH:en", name: "Google News Economy", category: "economy", tier: 4 },
  { url: "https://news.google.com/rss/search?q=Philippines+military+AFP+EDCA&hl=en-PH&gl=PH&ceid=PH:en", name: "Google News Military", category: "defense", tier: 4 },
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", name: "BBC Asia", category: "national-politics", tier: 4 },
];

let directNewsCache: { articles: NewsArticle[]; fetchedAt: number } | null = null;
const DIRECT_CACHE_TTL = 120_000;

async function fetchDirectNews(category?: string): Promise<NewsArticle[]> {
  if (directNewsCache && Date.now() - directNewsCache.fetchedAt < DIRECT_CACHE_TTL) {
    const cached = directNewsCache.articles;
    return category ? cached.filter((a) => a.category === category) : cached;
  }

  const articles: NewsArticle[] = [];
  let nextId = 1;

  const fetches = DIRECT_FEEDS.map(async (feed) => {
    try {
      const res = await fetch(`${RSS2JSON_BASE}${encodeURIComponent(feed.url)}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return;
      const json = (await res.json()) as RSS2JSONResponse;
      if (json.status !== "ok" || !json.items) return;

      for (const item of json.items) {
        if (!item.title || !item.link) continue;
        articles.push({
          id: nextId++,
          urlHash: String(nextId),
          title: item.title,
          url: item.link,
          source: feed.name,
          sourceTier: feed.tier as NewsArticle["sourceTier"],
          category: feed.category as NewsArticle["category"],
          publishedAt: item.pubDate || null,
          fetchedAt: new Date().toISOString(),
          entities: [],
          sentiment: "neutral",
        });
      }
    } catch {
      // silently skip failed feeds
    }
  });

  await Promise.allSettled(fetches);

  articles.sort((a, b) => {
    const da = a.publishedAt || a.fetchedAt;
    const db = b.publishedAt || b.fetchedAt;
    return db.localeCompare(da);
  });

  directNewsCache = { articles, fetchedAt: Date.now() };
  return category ? articles.filter((a) => a.category === category) : articles;
}

async function fetchDirectEarthquakes(): Promise<Earthquake[]> {
  try {
    const url =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson" +
      "&minlatitude=3&maxlatitude=22&minlongitude=114&maxlongitude=128" +
      "&limit=20&orderby=time&minmagnitude=2";
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return [];
    const geojson = await res.json();
    if (!geojson.features) return [];

    return geojson.features.map((f: { id: string; properties: { mag: number; place: string; time: number; tsunami: number }; geometry: { coordinates: number[] } }, i: number) => ({
      id: i + 1,
      magnitude: f.properties.mag,
      depthKm: f.geometry.coordinates[2] || null,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      locationText: f.properties.place || null,
      intensity: null,
      tsunamiAdvisory: f.properties.tsunami === 1,
      source: "usgs",
      occurredAt: new Date(f.properties.time).toISOString(),
    }));
  } catch {
    return [];
  }
}

interface GDELTDoc {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

async function fetchDirectGDELT(): Promise<NewsArticle[]> {
  try {
    const terms = "Philippines OR Filipino OR Manila OR WPS OR Mindanao OR PAGASA";
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(terms)}&mode=artlist&maxrecords=30&format=json&sourcelang=eng`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.articles) return [];

    return json.articles.map((a: GDELTDoc, i: number) => {
      const lower = a.title.toLowerCase();
      let category = "national-politics";
      if (lower.includes("wps") || lower.includes("south china sea") || lower.includes("spratlys")) category = "wps-maritime";
      else if (lower.includes("typhoon") || lower.includes("earthquake") || lower.includes("flood")) category = "disaster";
      else if (lower.includes("military") || lower.includes("armed forces") || lower.includes("defense")) category = "defense";
      else if (lower.includes("economy") || lower.includes("peso") || lower.includes("inflation")) category = "economy";

      return {
        id: 10000 + i,
        urlHash: `gdelt_${i}`,
        title: a.title,
        url: a.url,
        source: a.domain || "GDELT",
        sourceTier: 4 as NewsArticle["sourceTier"],
        category: category as NewsArticle["category"],
        publishedAt: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6Z")).toISOString() : new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        entities: [],
        sentiment: "neutral" as const,
      };
    });
  } catch {
    return [];
  }
}

function buildBaselineRegionScores(): RegionalStabilityScore[] {
  return [
    { regionId: RegionId.NCR, score: REGION_BASELINES[RegionId.NCR] * 0.3 + 20 * 0.25 + 20 * 0.25 + 20 * 0.2, components: { baselineRisk: REGION_BASELINES[RegionId.NCR], unrest: 20, security: 20, information: 20 }, boosts: {}, level: getStabilityLevel(REGION_BASELINES[RegionId.NCR] * 0.3 + 20 * 0.25 + 20 * 0.25 + 20 * 0.2), trend: "stable", computedAt: new Date().toISOString() },
    { regionId: RegionId.BARMM, score: REGION_BASELINES[RegionId.BARMM] * 0.3 + 20 * 0.25 + 30 * 0.25 + 20 * 0.2, components: { baselineRisk: REGION_BASELINES[RegionId.BARMM], unrest: 20, security: 30, information: 20 }, boosts: {}, level: getStabilityLevel(REGION_BASELINES[RegionId.BARMM] * 0.3 + 20 * 0.25 + 30 * 0.25 + 20 * 0.2), trend: "stable", computedAt: new Date().toISOString() },
    { regionId: RegionId.WPS, score: REGION_BASELINES[RegionId.WPS] * 0.3 + 0 * 0.25 + 20 * 0.25 + 20 * 0.2, components: { baselineRisk: REGION_BASELINES[RegionId.WPS], unrest: 0, security: 20, information: 20 }, boosts: {}, level: getStabilityLevel(REGION_BASELINES[RegionId.WPS] * 0.3 + 0 * 0.25 + 20 * 0.25 + 20 * 0.2), trend: "stable", computedAt: new Date().toISOString() },
    { regionId: RegionId.CAR, score: REGION_BASELINES[RegionId.CAR] * 0.3 + 20 * 0.25 + 25 * 0.25 + 20 * 0.2, components: { baselineRisk: REGION_BASELINES[RegionId.CAR], unrest: 20, security: 25, information: 20 }, boosts: {}, level: getStabilityLevel(REGION_BASELINES[RegionId.CAR] * 0.3 + 20 * 0.25 + 25 * 0.25 + 20 * 0.2), trend: "stable", computedAt: new Date().toISOString() },
    { regionId: RegionId.EVBicol, score: REGION_BASELINES[RegionId.EVBicol] * 0.3 + 15 * 0.25 + 20 * 0.25 + 20 * 0.2, components: { baselineRisk: REGION_BASELINES[RegionId.EVBicol], unrest: 15, security: 20, information: 20 }, boosts: {}, level: getStabilityLevel(REGION_BASELINES[RegionId.EVBicol] * 0.3 + 15 * 0.25 + 20 * 0.25 + 20 * 0.2), trend: "stable", computedAt: new Date().toISOString() },
  ];
}

// ─── ApiClient ───

export class ApiClient {
  async getNews(category?: string): Promise<ApiResponse<NewsArticle[]>> {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    try {
      const result = await fetchJson<NewsArticle[]>(`/api/news${params}`);
      if (result.data.length > 0) return result;
    } catch { /* fall through to direct fetch */ }

    // Fallback: fetch directly from RSS feeds and GDELT
    try {
      const [rssArticles, gdeltArticles] = await Promise.allSettled([
        fetchDirectNews(category),
        category ? Promise.resolve([]) : fetchDirectGDELT(),
      ]);

      const combined: NewsArticle[] = [];
      if (rssArticles.status === "fulfilled") combined.push(...rssArticles.value);
      if (gdeltArticles.status === "fulfilled") combined.push(...gdeltArticles.value);

      // Deduplicate by title similarity
      const seen = new Set<string>();
      const deduped = combined.filter((a) => {
        const key = a.title.toLowerCase().slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      deduped.sort((a, b) => {
        const da = a.publishedAt || a.fetchedAt;
        const db = b.publishedAt || b.fetchedAt;
        return db.localeCompare(da);
      });

      if (deduped.length > 0) {
        return { data: deduped.slice(0, 50), meta: liveMeta() };
      }
    } catch { /* fall through */ }

    return { data: [], meta: emptyMeta() };
  }

  async getWPSVessels(): Promise<ApiResponse<TrackedVessel[]>> {
    return fetchJsonWithFallback("/api/wps", []);
  }

  async getWPSIncidents(): Promise<ApiResponse<WPSIncident[]>> {
    return fetchJsonWithFallback("/api/wps/incidents", []);
  }

  async getWPSTension(): Promise<ApiResponse<WPSTensionScore>> {
    return fetchJsonWithFallback("/api/wps/tension", {
      score: 14.5,
      components: { vesselIntrusions: 15, diplomaticSignals: 10, militaryActivity: 20, newsVelocity: 10 },
      level: "low" as WPSTensionScore["level"],
      trend: "stable",
      computedAt: new Date().toISOString(),
    });
  }

  async getDisaster(): Promise<ApiResponse<{ typhoons: Typhoon[]; earthquakes: Earthquake[]; volcanoes: VolcanoStatus[]; weatherAdvisories: WeatherAdvisory[] }>> {
    try {
      const result = await fetchJson<{ typhoons: Typhoon[]; earthquakes: Earthquake[]; volcanoes: VolcanoStatus[]; weatherAdvisories: WeatherAdvisory[] }>("/api/disaster");
      const hasData = result.data.earthquakes.length > 0 || result.data.typhoons.length > 0 || result.data.volcanoes.length > 0;
      if (hasData) return result;
    } catch { /* fall through */ }

    // Fallback: fetch earthquakes directly from USGS
    const earthquakes = await fetchDirectEarthquakes();

    // Provide baseline volcano status from known Philippine volcanoes
    const baselineVolcanoes: VolcanoStatus[] = [
      { id: "taal", name: "Taal", lat: 14.002, lon: 120.993, alertLevel: 1, alertDescription: "Low-level unrest", observations: [], lastBulletinAt: null },
      { id: "mayon", name: "Mayon", lat: 13.257, lon: 123.685, alertLevel: 1, alertDescription: "Low-level unrest", observations: [], lastBulletinAt: null },
      { id: "kanlaon", name: "Kanlaon", lat: 10.412, lon: 123.132, alertLevel: 2, alertDescription: "Moderate unrest", observations: [], lastBulletinAt: null },
      { id: "bulusan", name: "Bulusan", lat: 12.77, lon: 124.05, alertLevel: 1, alertDescription: "Low-level unrest", observations: [], lastBulletinAt: null },
      { id: "pinatubo", name: "Pinatubo", lat: 15.13, lon: 120.35, alertLevel: 0, alertDescription: "Normal", observations: [], lastBulletinAt: null },
      { id: "hibok-hibok", name: "Hibok-Hibok", lat: 9.203, lon: 124.673, alertLevel: 0, alertDescription: "Normal", observations: [], lastBulletinAt: null },
    ];

    return {
      data: { typhoons: [], earthquakes, volcanoes: baselineVolcanoes, weatherAdvisories: [] },
      meta: earthquakes.length > 0 ? liveMeta() : emptyMeta(),
    };
  }

  async getMarket(): Promise<ApiResponse<EconomicDataPoint[]>> {
    return fetchJsonWithFallback("/api/market", []);
  }

  async getRiskScores(): Promise<ApiResponse<{ regions: RegionalStabilityScore[]; wpsTension: WPSTensionScore }>> {
    try {
      const result = await fetchJson<{ regions: RegionalStabilityScore[]; wpsTension: WPSTensionScore }>("/api/risk-scores");
      if (result.data.regions.length > 0) return result;
    } catch { /* fall through */ }

    // Return baseline stability scores so the panel always shows data
    return {
      data: {
        regions: buildBaselineRegionScores(),
        wpsTension: {
          score: 14.5,
          components: { vesselIntrusions: 15, diplomaticSignals: 10, militaryActivity: 20, newsVelocity: 10 },
          level: getStabilityLevel(14.5),
          trend: "stable",
          computedAt: new Date().toISOString(),
        },
      },
      meta: emptyMeta(),
    };
  }

  async getSummary(headlineIds: number[]): Promise<ApiResponse<AISummary>> {
    return fetchJsonWithFallback("/api/summarize", {
      summaryText: "Connect to the backend for AI-powered intelligence briefings.",
      focalPoints: [],
      provider: "none",
      createdAt: new Date().toISOString(),
    }, {
      method: "POST",
      body: JSON.stringify({ headlineIds }),
    });
  }

  async getMilitary(): Promise<ApiResponse<unknown[]>> {
    return fetchJsonWithFallback("/api/military", []);
  }

  async getHealth(): Promise<HealthResponse> {
    const urls = API_BASE
      ? [`${API_BASE}/api/health`, "/api/health"]
      : ["/api/health"];

    let lastErr: Error | null = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) {
          throw new Error(`Health check failed: ${res.status}`);
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(`Health check returned non-JSON: ${contentType}`);
        }
        return await res.json();
      } catch (err) {
        lastErr = err as Error;
      }
    }
    throw lastErr || new Error("Health check failed");
  }
}
