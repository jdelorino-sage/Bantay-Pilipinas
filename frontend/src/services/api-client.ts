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
  SocialFeedItem,
} from "@bantay-pilipinas/shared";

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

export class ApiClient {
  async getNews(category?: string): Promise<ApiResponse<NewsArticle[]>> {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    return fetchJsonWithFallback(`/api/news${params}`, []);
  }

  async getWPSVessels(): Promise<ApiResponse<TrackedVessel[]>> {
    return fetchJsonWithFallback("/api/wps", []);
  }

  async getWPSIncidents(): Promise<ApiResponse<WPSIncident[]>> {
    return fetchJsonWithFallback("/api/wps/incidents", []);
  }

  async getWPSTension(): Promise<ApiResponse<WPSTensionScore>> {
    return fetchJsonWithFallback("/api/wps/tension", {
      score: 0,
      components: { vesselIntrusions: 0, diplomaticSignals: 0, militaryActivity: 0, newsVelocity: 0 },
      level: "low" as WPSTensionScore["level"],
      trend: "stable",
      computedAt: new Date().toISOString(),
    });
  }

  async getDisaster(): Promise<ApiResponse<{ typhoons: Typhoon[]; earthquakes: Earthquake[]; volcanoes: VolcanoStatus[]; weatherAdvisories: WeatherAdvisory[] }>> {
    return fetchJsonWithFallback("/api/disaster", { typhoons: [], earthquakes: [], volcanoes: [], weatherAdvisories: [] });
  }

  async getMarket(): Promise<ApiResponse<EconomicDataPoint[]>> {
    return fetchJsonWithFallback("/api/market", []);
  }

  async getRiskScores(): Promise<ApiResponse<{ regions: RegionalStabilityScore[]; wpsTension: WPSTensionScore }>> {
    return fetchJsonWithFallback("/api/risk-scores", {
      regions: [],
      wpsTension: {
        score: 0,
        components: { vesselIntrusions: 0, diplomaticSignals: 0, militaryActivity: 0, newsVelocity: 0 },
        level: "low" as WPSTensionScore["level"],
        trend: "stable",
        computedAt: new Date().toISOString(),
      },
    });
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

  async getSocialFeeds(platform?: string): Promise<ApiResponse<SocialFeedItem[]>> {
    const params = platform ? `?platform=${encodeURIComponent(platform)}` : "";
    return fetchJsonWithFallback(`/api/social-feeds${params}`, []);
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
