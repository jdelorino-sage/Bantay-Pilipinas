import type { FastifyInstance } from "fastify";
import { NewsCategory } from "@bantay-pilipinas/shared";
import type { NewsArticle, ApiResponse } from "@bantay-pilipinas/shared";
import { getStoredArticles } from "../scrapers/rss-aggregator.js";

const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: 1,
    urlHash: "abc123",
    title: "DFA files diplomatic protest over latest WPS incident",
    url: "https://example.com/news/1",
    source: "Philippine News Agency",
    sourceTier: 1,
    category: NewsCategory.WPSMaritime,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: ["DFA", "WPS"],
    sentiment: "negative",
  },
  {
    id: 2,
    urlHash: "def456",
    title: "PSEi closes higher on foreign fund inflows",
    url: "https://example.com/news/2",
    source: "BusinessWorld",
    sourceTier: 2,
    category: NewsCategory.Economy,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: ["PSE"],
    sentiment: "positive",
  },
];

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
      if (articles.length > 0) {
        const response: ApiResponse<NewsArticle[]> = {
          data: articles as unknown as NewsArticle[],
          meta: { freshness: "live", timestamp: new Date().toISOString() },
        };
        return response;
      }
    } catch (err) {
      console.warn("[news] Failed to get stored articles:", (err as Error).message);
    }

    let articles = FALLBACK_NEWS;
    if (category) {
      articles = articles.filter((a) => a.category === category);
    }
    const response: ApiResponse<NewsArticle[]> = {
      data: articles,
      meta: { freshness: "mock", timestamp: new Date().toISOString() },
    };
    return response;
  });
}
