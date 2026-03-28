import type { FastifyInstance } from "fastify";
import type { NewsArticle, ApiResponse } from "@bantay-pilipinas/shared";
import { getStoredArticles, getGeoArticles } from "../scrapers/rss-aggregator.js";

export function registerNewsRoutes(app: FastifyInstance): void {
  app.get("/api/news", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          category: { type: "string" },
          region: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  }, async (request) => {
    const { category, region } = request.query as { category?: string; region?: string };

    try {
      const articles = await getStoredArticles(category, 50, region);
      const response: ApiResponse<NewsArticle[]> = {
        data: articles as unknown as NewsArticle[],
        meta: { freshness: articles.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
      };
      return response;
    } catch (err) {
      console.warn("[news] Failed to get stored articles:", (err as Error).message);
      const response: ApiResponse<NewsArticle[]> = {
        data: [],
        meta: { freshness: "error", timestamp: new Date().toISOString() },
      };
      return response;
    }
  });

  app.get("/api/news/geo", async () => {
    try {
      const articles = await getGeoArticles(100);
      const response: ApiResponse<NewsArticle[]> = {
        data: articles as unknown as NewsArticle[],
        meta: { freshness: articles.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
      };
      return response;
    } catch (err) {
      console.warn("[news] Failed to get geo articles:", (err as Error).message);
      return { data: [], meta: { freshness: "error", timestamp: new Date().toISOString() } };
    }
  });
}
