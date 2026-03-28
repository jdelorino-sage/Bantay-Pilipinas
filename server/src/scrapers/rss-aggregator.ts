import Parser from "rss-parser";
import { CircuitBreaker } from "../services/circuit-breaker.js";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";
import type { FeedConfig } from "../config/feeds.js";
import { extractLocation } from "../services/location-extractor.js";

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "BantayPilipinas/1.0 (Philippine News Monitor)" },
});

const MEMORY_STORE_MAX = 2000;
const MEMORY_STORE_PRUNE = 500;

interface StoredArticle {
  id: number;
  urlHash: string;
  title: string;
  url: string;
  source: string;
  sourceTier: number;
  category: string;
  publishedAt: string | null;
  fetchedAt: string;
  entities: string[];
  sentiment: string;
  regionId: string | null;
  lat: number | null;
  lon: number | null;
}

const breakers = new Map<string, CircuitBreaker>();
const memoryStore = new Map<string, StoredArticle>();
let nextMemoryId = 1;

function getBreaker(feedId: string): CircuitBreaker {
  if (!breakers.has(feedId)) {
    breakers.set(feedId, new CircuitBreaker(feedId));
  }
  return breakers.get(feedId)!;
}

function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36) + url.length.toString(36);
}

async function storeArticle(
  feed: FeedConfig,
  title: string,
  url: string,
  publishedAt: string | null
): Promise<void> {
  const urlHash = hashUrl(url);

  // Resolve location: use feed's region/location or extract from title
  let regionId: string | null = feed.regionId || null;
  let lat: number | null = feed.location?.lat ?? null;
  let lon: number | null = feed.location?.lon ?? null;

  if (!regionId) {
    const extracted = extractLocation(title);
    if (extracted) {
      regionId = extracted.regionId;
      lat = extracted.lat;
      lon = extracted.lon;
    }
  }

  if (hasDatabaseUrl()) {
    await query(
      `INSERT INTO ${TABLES.NEWS_ARTICLES}
       (url_hash, title, url, source, source_tier, category, published_at, entities, sentiment, region_id, lat, lon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (url_hash) DO NOTHING`,
      [urlHash, title, url, feed.name, feed.tier, feed.category, publishedAt, JSON.stringify([]), "neutral", regionId, lat, lon]
    );
  } else {
    if (memoryStore.has(urlHash)) return;
    if (memoryStore.size >= MEMORY_STORE_MAX) {
      const entries = [...memoryStore.entries()]
        .sort((a, b) => (a[1].fetchedAt).localeCompare(b[1].fetchedAt));
      for (let i = 0; i < MEMORY_STORE_PRUNE && i < entries.length; i++) {
        memoryStore.delete(entries[i][0]);
      }
    }
    memoryStore.set(urlHash, {
      id: nextMemoryId++,
      urlHash,
      title,
      url,
      source: feed.name,
      sourceTier: feed.tier,
      category: feed.category,
      publishedAt,
      fetchedAt: new Date().toISOString(),
      entities: [],
      sentiment: "neutral",
      regionId,
      lat,
      lon,
    });
  }
}

export async function fetchFeed(feed: FeedConfig): Promise<number> {
  const breaker = getBreaker(feed.id);
  if (!breaker.canExecute()) return 0;

  let count = 0;
  try {
    const result = await parser.parseURL(feed.url);
    breaker.recordSuccess();

    for (const item of result.items) {
      if (!item.link || !item.title) continue;
      const publishedAt = item.isoDate || item.pubDate || null;
      await storeArticle(feed, item.title, item.link, publishedAt);
      count++;
    }
  } catch (err) {
    breaker.recordFailure();
    console.error(`[rss] Failed to fetch ${feed.name}:`, (err as Error).message);
  }
  return count;
}

export async function runAggregator(feeds: FeedConfig[]): Promise<number> {
  let total = 0;
  const batchSize = 10;
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(fetchFeed));
    for (const r of results) {
      if (r.status === "fulfilled") total += r.value;
    }
  }
  console.log(`[rss] Aggregated ${total} articles from ${feeds.length} feeds (store: ${hasDatabaseUrl() ? "db" : "memory"})`);
  return total;
}

export async function getStoredArticles(
  category?: string,
  limit = 50,
  regionId?: string
): Promise<StoredArticle[]> {
  if (hasDatabaseUrl()) {
    try {
      let sql = `SELECT id, url_hash as "urlHash", title, url, source, source_tier as "sourceTier",
                        category, published_at as "publishedAt", fetched_at as "fetchedAt",
                        entities, sentiment, region_id as "regionId", lat, lon
                 FROM ${TABLES.NEWS_ARTICLES}`;
      const conditions: string[] = [];
      const params: unknown[] = [];
      if (category) {
        params.push(category);
        conditions.push(`category = $${params.length}`);
      }
      if (regionId) {
        params.push(regionId);
        conditions.push(`region_id = $${params.length}`);
      }
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }
      params.push(limit);
      sql += ` ORDER BY COALESCE(published_at, fetched_at) DESC LIMIT $${params.length}`;
      const result = await query(sql, params);
      return result.rows.map((r: Record<string, unknown>) => ({
        ...r,
        entities: Array.isArray(r.entities) ? r.entities : JSON.parse(String(r.entities || "[]")),
      })) as StoredArticle[];
    } catch (err) {
      console.error("[rss] DB query failed, falling back to memory:", (err as Error).message);
    }
  }

  let articles = Array.from(memoryStore.values());
  if (category) {
    articles = articles.filter((a) => a.category === category);
  }
  if (regionId) {
    articles = articles.filter((a) => a.regionId === regionId);
  }
  articles.sort((a, b) => {
    const dateA = a.publishedAt || a.fetchedAt;
    const dateB = b.publishedAt || b.fetchedAt;
    return dateB.localeCompare(dateA);
  });
  return articles.slice(0, limit);
}

export async function getGeoArticles(limit = 100): Promise<StoredArticle[]> {
  if (hasDatabaseUrl()) {
    try {
      const result = await query(
        `SELECT id, url_hash as "urlHash", title, url, source, source_tier as "sourceTier",
                category, published_at as "publishedAt", fetched_at as "fetchedAt",
                entities, sentiment, region_id as "regionId", lat, lon
         FROM ${TABLES.NEWS_ARTICLES}
         WHERE lat IS NOT NULL AND lon IS NOT NULL
         ORDER BY COALESCE(published_at, fetched_at) DESC LIMIT $1`,
        [limit]
      );
      return result.rows as StoredArticle[];
    } catch (err) {
      console.error("[rss] Geo query failed:", (err as Error).message);
    }
  }

  return Array.from(memoryStore.values())
    .filter((a) => a.lat != null && a.lon != null)
    .sort((a, b) => (b.publishedAt || b.fetchedAt).localeCompare(a.publishedAt || a.fetchedAt))
    .slice(0, limit);
}

export function getArticleCount(): number {
  return memoryStore.size;
}
