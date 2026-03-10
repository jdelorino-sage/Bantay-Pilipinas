import { PH_BOUNDS } from "@bantay-pilipinas/shared";
import { CircuitBreaker } from "../services/circuit-breaker.js";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";

const breaker = new CircuitBreaker("gdelt", 3, 120_000);

interface GDELTArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

export async function fetchGDELT(): Promise<void> {
  if (!breaker.canExecute()) return;

  try {
    const phTerms = "Philippines OR Filipino OR Manila OR Duterte OR Marcos OR WPS OR Mindanao OR PAGASA";
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(phTerms)}&mode=artlist&maxrecords=50&format=json&sourcelang=eng`;

    const res = await fetch(url, {
      headers: { "User-Agent": "BantayPilipinas/1.0" },
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
    const json = await res.json() as { articles?: GDELTArticle[] };

    breaker.recordSuccess();

    if (!json.articles || !Array.isArray(json.articles)) {
      console.log("[gdelt] No articles returned");
      return;
    }

    void PH_BOUNDS;

    let stored = 0;
    for (const article of json.articles) {
      if (!article.url || !article.title) continue;

      if (hasDatabaseUrl()) {
        const urlHash = hashUrl(article.url);
        await query(
          `INSERT INTO ${TABLES.NEWS_ARTICLES}
           (url_hash, title, url, source, source_tier, category, published_at, entities, sentiment)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (url_hash) DO NOTHING`,
          [
            urlHash,
            article.title,
            article.url,
            article.domain || "GDELT",
            4,
            categorizeGDELT(article.title),
            article.seendate ? parseGDELTDate(article.seendate) : new Date().toISOString(),
            JSON.stringify([]),
            "neutral",
          ]
        ).catch((err: unknown) => console.error("[gdelt] DB insert failed:", (err as Error).message));
      }
      stored++;
    }

    console.log(`[gdelt] Fetched ${stored} articles (store: ${hasDatabaseUrl() ? "db" : "memory"})`);
  } catch (err) {
    breaker.recordFailure();
    console.error("[gdelt] Fetch failed:", (err as Error).message);
  }
}

function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return "gdelt_" + Math.abs(hash).toString(36) + url.length.toString(36);
}

function parseGDELTDate(dateStr: string): string {
  try {
    const cleaned = dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, "$1-$2-$3T$4:$5:$6Z");
    return new Date(cleaned).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function categorizeGDELT(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("wps") || lower.includes("south china sea") || lower.includes("spratlys") || lower.includes("scarborough"))
    return "wps-maritime";
  if (lower.includes("typhoon") || lower.includes("earthquake") || lower.includes("flood") || lower.includes("volcano"))
    return "disaster";
  if (lower.includes("military") || lower.includes("armed forces") || lower.includes("defense"))
    return "defense";
  if (lower.includes("economy") || lower.includes("peso") || lower.includes("inflation") || lower.includes("gdp"))
    return "economy";
  if (lower.includes("ofw") || lower.includes("remittance") || lower.includes("overseas"))
    return "ofw-diaspora";
  return "national-politics";
}
