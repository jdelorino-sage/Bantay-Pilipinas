import type { FastifyInstance } from "fastify";
import type { NewsArticle, ApiResponse } from "@bantay-pilipinas/shared";
import { getStoredArticles } from "../scrapers/rss-aggregator.js";

export function registerNewsRoutes(app: FastifyInstance): void {
  app.get("/api/news", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          category: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  }, async (request) => {
    const { category } = request.query as { category?: string };

    try {
      const articles = await getStoredArticles(category, 50);
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
}
