import { describe, it, expect } from "vitest";

interface FeedConfig {
  id: string;
  name: string;
  url: string;
  tier: number;
  category: string;
}

const { PH_FEEDS } = await import("../server/src/config/feeds.js");

describe("PH_FEEDS configuration", () => {
  it("has at least 30 feeds", () => {
    expect(PH_FEEDS.length).toBeGreaterThanOrEqual(30);
  });

  it("every feed has required fields", () => {
    for (const feed of PH_FEEDS) {
      expect(feed.id).toBeTruthy();
      expect(feed.name).toBeTruthy();
      expect(feed.url).toBeTruthy();
      expect(feed.tier).toBeGreaterThanOrEqual(1);
      expect(feed.tier).toBeLessThanOrEqual(4);
      expect(feed.category).toBeTruthy();
    }
  });

  it("has no duplicate feed IDs", () => {
    const ids = PH_FEEDS.map((f: FeedConfig) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("has no duplicate URLs", () => {
    const urls = PH_FEEDS.map((f: FeedConfig) => f.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  it("all URLs use HTTPS", () => {
    for (const feed of PH_FEEDS) {
      expect(feed.url).toMatch(/^https:\/\//);
    }
  });

  it("does not include known dead feeds", () => {
    const deadDomains = ["cnnphilippines.com", "reuters.com/rss"];
    for (const feed of PH_FEEDS) {
      for (const dead of deadDomains) {
        expect(feed.url).not.toContain(dead);
      }
    }
  });

  it("has feeds in all major categories", () => {
    const categories = new Set(PH_FEEDS.map((f: FeedConfig) => f.category));
    expect(categories.has("national-politics")).toBe(true);
    expect(categories.has("wps-maritime")).toBe(true);
    expect(categories.has("disaster")).toBe(true);
    expect(categories.has("economy")).toBe(true);
    expect(categories.has("defense")).toBe(true);
  });

  it("has feeds from multiple tiers", () => {
    const tier2 = PH_FEEDS.filter((f: FeedConfig) => f.tier === 2);
    const tier4 = PH_FEEDS.filter((f: FeedConfig) => f.tier === 4);
    expect(tier2.length).toBeGreaterThanOrEqual(5);
    expect(tier4.length).toBeGreaterThanOrEqual(10);
  });

  it("has working feeds across tiers", () => {
    const tiers = new Set(PH_FEEDS.map((f: FeedConfig) => f.tier));
    expect(tiers.size).toBeGreaterThanOrEqual(2);
  });
});
