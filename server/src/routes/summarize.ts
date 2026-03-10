import type { FastifyInstance } from "fastify";
import type { ApiResponse, AISummary } from "@bantay-pilipinas/shared";
import { generateSummary } from "../services/ai-summarizer.js";
import { getStoredArticles } from "../scrapers/rss-aggregator.js";
import { LRUCache } from "../services/cache.js";

const summaryCache = new LRUCache<AISummary>(20);
const CACHE_TTL = 300_000;

export function registerSummarizeRoutes(app: FastifyInstance): void {
  app.post("/api/summarize", {
    schema: {
      body: {
        type: "object",
        required: ["headlineIds"],
        properties: {
          headlineIds: {
            type: "array",
            items: { type: "integer" },
            minItems: 1,
            maxItems: 50,
          },
        },
        additionalProperties: false,
      },
    },
  }, async (request) => {
    const { headlineIds } = request.body as { headlineIds: number[] };

    const cacheKey = `summary:${headlineIds.sort().join(",")}`;
    const cached = summaryCache.get(cacheKey);
    if (cached) {
      const response: ApiResponse<AISummary> = {
        data: cached,
        meta: { freshness: "cached", timestamp: new Date().toISOString() },
      };
      return response;
    }

    const articles = await getStoredArticles(undefined, 50);
    const headlineMap = new Map(articles.map((a) => [a.id, a.title]));
    const headlines = headlineIds
      .map((id) => headlineMap.get(id))
      .filter((h): h is string => h != null);

    if (headlines.length === 0) {
      const fallbackHeadlines = articles.slice(0, Math.min(headlineIds.length, 20)).map((a) => a.title);
      headlines.push(...fallbackHeadlines);
    }

    const summary = await generateSummary(headlines.length > 0 ? headlines : ["No headlines available"]);
    summaryCache.set(cacheKey, summary, CACHE_TTL);

    const response: ApiResponse<AISummary> = {
      data: summary,
      meta: { freshness: summary.provider === "none" ? "empty" : "live", timestamp: new Date().toISOString() },
    };
    return response;
  });
}
