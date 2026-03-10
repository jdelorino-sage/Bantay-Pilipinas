import Parser from "rss-parser";
import { CircuitBreaker } from "../services/circuit-breaker.js";
import type { SocialFeedItem } from "@bantay-pilipinas/shared";

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "BantayPilipinas/1.0 (Philippine News Monitor)" },
  customFields: {
    item: [
      ["media:group", "mediaGroup"],
      ["media:thumbnail", "mediaThumbnail"],
      ["yt:videoId", "ytVideoId"],
    ],
  },
});

const MAX_ITEMS = 200;
const PRUNE_COUNT = 50;

interface SocialFeedSource {
  id: string;
  name: string;
  url: string;
  platform: SocialFeedItem["platform"];
}

const SOCIAL_SOURCES: SocialFeedSource[] = [
  { id: "yt-abscbn", name: "ABS-CBN News", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCstEtN1GBximQ0ZMy2FE0dA", platform: "youtube" },
  { id: "yt-gma", name: "GMA News", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCVPbYEWwYOH5jm6Bvi0XkYg", platform: "youtube" },
  { id: "yt-ptv", name: "PTV", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCm1oP_sg26QBKAC4UGFjMhA", platform: "youtube" },
  { id: "yt-rappler", name: "Rappler", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCiNfMdFmMnMHFGNRsaRwISA", platform: "youtube" },
  { id: "yt-cnnph", name: "CNN PH", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCeEj9SKvxkOTkmGmFSMredQ", platform: "youtube" },
  { id: "yt-inquirer", name: "Inquirer", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCkI4MSujJJGP-n108BgBKRQ", platform: "youtube" },
  { id: "yt-untv", name: "UNTV News", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCeaB-mJyLjZGi85CIR6PFpg", platform: "youtube" },
  { id: "yt-onenews", name: "One News PH", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCm0nRQPKqYjE0kD2RAxsVwg", platform: "youtube" },
  { id: "reddit-ph", name: "r/Philippines", url: "https://www.reddit.com/r/Philippines/.rss", platform: "reddit" },
  { id: "reddit-phnews", name: "r/phnews", url: "https://www.reddit.com/r/phnews/.rss", platform: "reddit" },
  { id: "reddit-pilipinas", name: "r/Pilipinas", url: "https://www.reddit.com/r/Pilipinas/.rss", platform: "reddit" },
];

const breakers = new Map<string, CircuitBreaker>();
const feedStore = new Map<string, SocialFeedItem>();

function getBreaker(feedId: string): CircuitBreaker {
  if (!breakers.has(feedId)) {
    breakers.set(feedId, new CircuitBreaker(feedId));
  }
  return breakers.get(feedId)!;
}

function extractYouTubeVideoId(item: Record<string, unknown>): string | null {
  if (typeof item.ytVideoId === "string") return item.ytVideoId;
  const link = String(item.link || "");
  const match = link.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  const idMatch = link.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  return idMatch ? idMatch[1] : null;
}

function extractThumbnail(item: Record<string, unknown>, videoId: string | null): string | null {
  if (item.mediaThumbnail && typeof (item.mediaThumbnail as Record<string, unknown>).$ === "object") {
    const attrs = (item.mediaThumbnail as Record<string, Record<string, string>>).$;
    if (attrs.url) return attrs.url;
  }
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  }
  return null;
}

async function fetchSocialFeed(source: SocialFeedSource): Promise<number> {
  const breaker = getBreaker(source.id);
  if (!breaker.canExecute()) return 0;

  let count = 0;
  try {
    const result = await parser.parseURL(source.url);
    breaker.recordSuccess();

    for (const item of result.items) {
      if (!item.link || !item.title) continue;

      const itemRecord = item as unknown as Record<string, unknown>;
      const videoId = source.platform === "youtube" ? extractYouTubeVideoId(itemRecord) : null;
      const thumbnailUrl = source.platform === "youtube" ? extractThumbnail(itemRecord, videoId) : null;
      const publishedAt = item.isoDate || item.pubDate || null;
      const itemId = `${source.id}:${item.link}`;

      if (feedStore.size >= MAX_ITEMS && !feedStore.has(itemId)) {
        const entries = [...feedStore.entries()]
          .sort((a, b) => (a[1].publishedAt || "").localeCompare(b[1].publishedAt || ""));
        for (let i = 0; i < PRUNE_COUNT && i < entries.length; i++) {
          feedStore.delete(entries[i][0]);
        }
      }

      feedStore.set(itemId, {
        id: itemId,
        platform: source.platform,
        title: item.title,
        url: item.link,
        author: source.name,
        publishedAt,
        thumbnailUrl,
        videoId,
      });
      count++;
    }
  } catch (err) {
    breaker.recordFailure();
    console.error(`[social] Failed to fetch ${source.name}:`, (err as Error).message);
  }
  return count;
}

export async function runSocialAggregator(): Promise<number> {
  let total = 0;
  const batchSize = 5;
  for (let i = 0; i < SOCIAL_SOURCES.length; i += batchSize) {
    const batch = SOCIAL_SOURCES.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(fetchSocialFeed));
    for (const r of results) {
      if (r.status === "fulfilled") total += r.value;
    }
  }
  console.log(`[social] Aggregated ${total} items from ${SOCIAL_SOURCES.length} social feeds`);
  return total;
}

export async function getSocialFeedItems(platform?: string): Promise<SocialFeedItem[]> {
  let items = Array.from(feedStore.values());
  if (platform) {
    items = items.filter((item) => item.platform === platform);
  }
  items.sort((a, b) => {
    const dateA = a.publishedAt || "";
    const dateB = b.publishedAt || "";
    return dateB.localeCompare(dateA);
  });
  return items.slice(0, 50);
}
