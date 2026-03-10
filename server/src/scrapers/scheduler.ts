import cron from "node-cron";
import { runAggregator } from "./rss-aggregator.js";
import { scrapePHIVOLCS, scrapeVolcanoStatus } from "./phivolcs-scraper.js";
import { scrapePAGASA } from "./pagasa-scraper.js";
import { scrapeBSP } from "./bsp-scraper.js";
import { fetchACLED } from "./acled-fetcher.js";
import { fetchGDELT } from "./gdelt-fetcher.js";
import { PH_FEEDS } from "../config/feeds.js";
import { runScoreComputation } from "../services/stability-scorer.js";

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
  gdelt: { status: "idle", lastRun: null, lastError: null, runCount: 0 },
  scores: { status: "idle", lastRun: null, lastError: null, runCount: 0 },
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
  // RSS feeds — every 60 seconds
  cron.schedule("* * * * *", () => {
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

  // BSP exchange rates + PSE — every 30 minutes
  cron.schedule("*/30 * * * *", () => {
    runWithStatus("bsp", () => scrapeBSP());
  });

  // ACLED conflict events — every hour
  cron.schedule("0 * * * *", () => {
    runWithStatus("acled", () => fetchACLED());
  });

  // GDELT news events — every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    runWithStatus("gdelt", () => fetchGDELT());
  });

  // Score computation (RSI + WPS Tension) — every 10 minutes
  cron.schedule("*/10 * * * *", () => {
    runWithStatus("scores", () => runScoreComputation());
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
    runWithStatus("bsp", () => scrapeBSP());
    runWithStatus("gdelt", () => fetchGDELT());
    runWithStatus("scores", () => runScoreComputation());
  }, 3_000);
}
