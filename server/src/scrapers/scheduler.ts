import cron from "node-cron";
import { runAggregator } from "./rss-aggregator.js";
import { scrapePHIVOLCS, scrapeVolcanoStatus } from "./phivolcs-scraper.js";
import { scrapePAGASA } from "./pagasa-scraper.js";
import { PH_FEEDS } from "../config/feeds.js";

export interface ScraperStatus {
  status: "idle" | "running" | "ok" | "error";
  lastRun: string | null;
  lastError: string | null;
  runCount: number;
}

const scraperStatuses: Record<string, ScraperStatus> = {
  rss: { status: "idle", lastRun: null, lastError: null, runCount: 0 },
  pagasa: { status: "idle", lastRun: null, lastError: null, runCount: 0 },
  phivolcs: { status: "idle", lastRun: null, lastError: null, runCount: 0 },
  bsp: { status: "idle", lastRun: null, lastError: null, runCount: 0 },
  acled: { status: "idle", lastRun: null, lastError: null, runCount: 0 },
};

async function runWithStatus(name: string, fn: () => Promise<unknown>): Promise<void> {
  const s = scraperStatuses[name];
  if (!s) return;
  s.status = "running";
  try {
    await fn();
    s.status = "ok";
    s.lastRun = new Date().toISOString();
    s.lastError = null;
    s.runCount++;
  } catch (err) {
    s.status = "error";
    s.lastRun = new Date().toISOString();
    s.lastError = (err as Error).message;
    s.runCount++;
  }
}

export function getScraperStatuses(): Record<string, ScraperStatus> {
  return { ...scraperStatuses };
}

export function startScheduler(): void {
  // RSS feeds — every 3 minutes
  cron.schedule("*/3 * * * *", () => {
    runWithStatus("rss", () => runAggregator(PH_FEEDS));
  });

  // PAGASA typhoon bulletins — every 30 minutes
  cron.schedule("*/30 * * * *", () => {
    runWithStatus("pagasa", () => scrapePAGASA());
  });

  // PHIVOLCS earthquakes — every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    runWithStatus("phivolcs", async () => {
      await scrapePHIVOLCS();
      await scrapeVolcanoStatus();
    });
  });

  // BSP exchange rates — every 30 minutes (stub, logs only)
  cron.schedule("*/30 * * * *", () => {
    console.log("[scheduler] BSP scraper tick (not yet implemented)");
  });

  // ACLED conflict events — every hour (stub, logs only)
  cron.schedule("0 * * * *", () => {
    console.log("[scheduler] ACLED fetcher tick (not yet implemented)");
  });

  // Score computation — every 10 minutes (stub, logs only)
  cron.schedule("*/10 * * * *", () => {
    console.log("[scheduler] Score computation tick (not yet implemented)");
  });

  console.log("[scheduler] All cron jobs registered");

  // Initial scrape on startup (don't wait for first cron tick)
  setTimeout(() => {
    console.log("[scheduler] Running initial scrape...");
    runWithStatus("rss", () => runAggregator(PH_FEEDS));
    runWithStatus("phivolcs", async () => {
      await scrapePHIVOLCS();
      await scrapeVolcanoStatus();
    });
    runWithStatus("pagasa", () => scrapePAGASA());
  }, 3_000);
}
