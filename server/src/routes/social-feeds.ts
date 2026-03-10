import type { FastifyInstance } from "fastify";
import type { ApiResponse, SocialFeedItem } from "@bantay-pilipinas/shared";
import { getSocialFeedItems } from "../scrapers/social-feed-aggregator.js";

export function registerSocialFeedRoutes(app: FastifyInstance): void {
  app.get("/api/social-feeds", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          platform: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  }, async (request) => {
    const { platform } = request.query as { platform?: string };

    try {
      const items = await getSocialFeedItems(platform);
      const response: ApiResponse<SocialFeedItem[]> = {
        data: items,
        meta: { freshness: items.length > 0 ? "live" : "empty", timestamp: new Date().toISOString() },
      };
      return response;
    } catch (err) {
      console.warn("[social-feeds] Failed to get social feed items:", (err as Error).message);
      const response: ApiResponse<SocialFeedItem[]> = {
        data: [],
        meta: { freshness: "error", timestamp: new Date().toISOString() },
      };
      return response;
    }
  });
}
