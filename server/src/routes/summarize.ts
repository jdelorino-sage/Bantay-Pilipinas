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
    try {
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
      const matched = headlineIds
        .map((id) => headlineMap.get(id))
        .filter((h): h is string => h != null);

      const finalHeadlines = matched.length > 0
        ? matched
        : articles.slice(0, 20).map((a) => a.title);

      const summary = await generateSummary(finalHeadlines.length > 0 ? finalHeadlines : ["No headlines available"]);
      summaryCache.set(cacheKey, summary, CACHE_TTL);

      const response: ApiResponse<AISummary> = {
        data: summary,
        meta: { freshness: summary.provider === "none" ? "empty" : "live", timestamp: new Date().toISOString() },
      };
      return response;
    } catch (err) {
      console.error("[summarize] Handler error:", (err as Error).message);
      return {
        data: { summaryText: "AI summarization temporarily unavailable.", focalPoints: [], provider: "none", createdAt: new Date().toISOString() },
        meta: { freshness: "error", timestamp: new Date().toISOString() },
      };
    }
  });
}
