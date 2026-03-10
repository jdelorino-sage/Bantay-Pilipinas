import * as cheerio from "cheerio";
import { CircuitBreaker } from "../services/circuit-breaker.js";
import { hasDatabaseUrl, query } from "../db/client.js";
import { TABLES } from "../db/schema.js";

const breaker = new CircuitBreaker("bsp", 3, 120_000);

const BSP_RATES_URL = "https://www.bsp.gov.ph/";

const memoryData = new Map<string, { value: number; source: string; recordedAt: string }>();

async function storeIndicator(indicator: string, value: number, currency: string, source: string): Promise<void> {
  if (hasDatabaseUrl()) {
    await query(
      `INSERT INTO ${TABLES.ECONOMIC_DATA} (indicator, value, currency, source, recorded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [indicator, value, currency, source]
    ).catch((err: unknown) => console.error("[bsp] DB insert failed:", (err as Error).message));
  } else {
    memoryData.set(indicator, { value, source, recordedAt: new Date().toISOString() });
  }
}

async function scrapeExchangeRate(): Promise<number> {
  let count = 0;
  try {
    const res = await fetch(BSP_RATES_URL, {
      headers: { "User-Agent": "BantayPilipinas/1.0 (Philippine Monitor)" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const bodyText = $("body").text();

    const fxMatch = bodyText.match(/(?:USD\/PHP|PHP\/USD|Reference Exchange Rate)[:\s]*([\d.]+)/i);
    if (fxMatch) {
      const rate = parseFloat(fxMatch[1]);
      if (rate > 40 && rate < 70) {
        await storeIndicator("USD/PHP", rate, "PHP", "bsp");
        count++;
      }
    }

    const rateMatch = bodyText.match(/(?:Overnight\s+(?:Borrowing|Lending|RRP)\s+Rate|BSP\s+(?:Key\s+)?Rate)[:\s]*([\d.]+)\s*%/i);
    if (rateMatch) {
      const rate = parseFloat(rateMatch[1]);
      if (rate > 0 && rate < 20) {
        await storeIndicator("BSP Rate", rate, "PHP", "bsp");
        count++;
      }
    }

    const inflationMatch = bodyText.match(/(?:Inflation|CPI)[:\s]*([\d.]+)\s*%/i);
    if (inflationMatch) {
      const rate = parseFloat(inflationMatch[1]);
      if (rate >= -5 && rate < 30) {
        await storeIndicator("Inflation", rate, "PHP", "bsp");
        count++;
      }
    }
  } catch (err) {
    console.warn("[bsp] Exchange rate scrape failed:", (err as Error).message);
  }

  return count;
}

async function scrapePSEi(): Promise<number> {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (!finnhubKey) return 0;

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=PSE:PSEi&token=${finnhubKey}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
    const data = await res.json() as { c?: number; pc?: number };

    if (data.c && data.c > 1000) {
      await storeIndicator("PSEi", data.c, "PHP", "pse");
      return 1;
    }
  } catch (err) {
    console.warn("[bsp] PSEi fetch failed:", (err as Error).message);
  }
  return 0;
}

export async function scrapeBSP(): Promise<void> {
  if (!breaker.canExecute()) return;

  try {
    const [fxCount, pseCount] = await Promise.all([
      scrapeExchangeRate(),
      scrapePSEi(),
    ]);

    breaker.recordSuccess();
    console.log(`[bsp] Scraped ${fxCount} BSP indicators, ${pseCount} PSE indicators (store: ${hasDatabaseUrl() ? "db" : "memory"})`);
  } catch (err) {
    breaker.recordFailure();
    console.error("[bsp] Scrape failed:", (err as Error).message);
  }
}

export function getMemoryMarketData(): Map<string, { value: number; source: string; recordedAt: string }> {
  return memoryData;
}
