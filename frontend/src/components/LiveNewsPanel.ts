import { escapeHtml } from "../utils/sanitize";
import type { ApiClient } from "../services/api-client";

interface LiveChannel {
  id: string;
  name: string;
  ytChannel: string;
}

const LIVE_CHANNELS: LiveChannel[] = [
  { id: "abs-cbn", name: "ABS-CBN", ytChannel: "UCstEtN1GBximQ0ZMy2FE0dA" },
  { id: "gma", name: "GMA", ytChannel: "UCVPbYEWwYOH5jm6Bvi0XkYg" },
  { id: "ptv", name: "PTV", ytChannel: "UCm1oP_sg26QBKAC4UGFjMhA" },
  { id: "onenews", name: "ONE NEWS", ytChannel: "UCupsMUp_wVBbHFjG2GXrwGw" },
  { id: "untv", name: "UNTV", ytChannel: "UCkMGhq6HKXN8KxGQkHPwCwQ" },
  { id: "rappler", name: "RAPPLER", ytChannel: "UCiNfMdFmMnMHFGNRsaRwISA" },
  { id: "net25", name: "NET25", ytChannel: "UCmIfWDzwVTmbYIleMi_yHcA" },
];

// Cache latest video IDs per channel
const videoIdCache = new Map<string, { videoId: string; fetchedAt: number }>();
const VIDEO_CACHE_TTL = 300_000; // 5 minutes

async function fetchLatestVideoId(channelId: string): Promise<string | null> {
  const cached = videoIdCache.get(channelId);
  if (cached && Date.now() - cached.fetchedAt < VIDEO_CACHE_TTL) {
    return cached.videoId;
  }
  try {
    const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)}`;
    const res = await fetch(rssUrl, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "ok" || !json.items?.[0]?.link) return null;
    const videoUrl = json.items[0].link as string;
    const match = videoUrl.match(/[?&]v=([^&]+)/);
    if (match) {
      videoIdCache.set(channelId, { videoId: match[1], fetchedAt: Date.now() });
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

export class LiveNewsPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;
  private activeChannel = LIVE_CHANNELS[0];
  private newsCount = 0;

  constructor(api: ApiClient) {
    this.api = api;
  }

  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel live-news-panel";
    el.innerHTML = this.buildHTML();
    this.el = el;
    this.attachEvents(el);
    this.loadRadar();
    this.loadVideo(el);
    return el;
  }

  private buildHTML(): string {
    const tabs = LIVE_CHANNELS.map(
      (ch) =>
        `<button class="channel-tab${ch.id === this.activeChannel.id ? " active" : ""}" data-channel="${ch.id}">${ch.name}</button>`
    ).join("");

    return `
      <div class="panel-header">
        <h2 class="panel-title">LIVE NEWS</h2>
        <span class="panel-badge live" id="news-count-badge">${this.newsCount}</span>
      </div>
      <div class="channel-tabs">${tabs}</div>
      <div class="video-container">
        <iframe
          id="live-video-iframe"
          src=""
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
        <div class="video-fallback hidden" id="video-fallback">
          <span class="fallback-icon">&#x1F4FA;</span>
          <span class="fallback-text">Loading video...</span>
          <a href="https://www.youtube.com/channel/${this.activeChannel.ytChannel}/live" target="_blank" rel="noopener" class="fallback-link">Watch on YouTube</a>
        </div>
        <div class="radar-overlay" id="radar-overlay">
          <span class="radar-label">ON OUR RADAR</span>
          <span class="radar-text" id="radar-text">Loading...</span>
        </div>
      </div>
    `;
  }

  private attachEvents(el: HTMLElement): void {
    el.querySelectorAll<HTMLButtonElement>(".channel-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const channelId = btn.dataset.channel!;
        const channel = LIVE_CHANNELS.find((c) => c.id === channelId);
        if (!channel) return;

        this.activeChannel = channel;
        el.querySelectorAll(".channel-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const fallback = el.querySelector<HTMLElement>("#video-fallback");
        if (fallback) {
          const link = fallback.querySelector<HTMLAnchorElement>(".fallback-link");
          if (link) link.href = `https://www.youtube.com/channel/${channel.ytChannel}/live`;
        }

        this.loadVideo(el);
      });
    });
  }

  private async loadVideo(el: HTMLElement): Promise<void> {
    const iframe = el.querySelector<HTMLIFrameElement>("#live-video-iframe");
    const fallback = el.querySelector<HTMLElement>("#video-fallback");
    if (!iframe || !fallback) return;

    // Show loading state
    iframe.classList.add("hidden");
    fallback.classList.remove("hidden");
    const fallbackText = fallback.querySelector(".fallback-text");
    if (fallbackText) fallbackText.textContent = "Loading video...";

    // Strategy: fetch latest video ID first, then try live stream
    const videoId = await fetchLatestVideoId(this.activeChannel.ytChannel);

    if (videoId) {
      // Got a video ID - embed it (may be live or recent upload)
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
      iframe.classList.remove("hidden");
      fallback.classList.add("hidden");
    } else {
      // No video ID from RSS - try live_stream embed as last resort
      iframe.src = `https://www.youtube.com/embed/live_stream?channel=${this.activeChannel.ytChannel}&autoplay=1&mute=1`;
      iframe.classList.remove("hidden");
      fallback.classList.add("hidden");

      // If that also fails after 6 seconds, show fallback
      setTimeout(() => {
        if (fallbackText) fallbackText.textContent = "Live stream unavailable";
      }, 6_000);
    }
  }

  private async loadRadar(): Promise<void> {
    try {
      const res = await this.api.getNews();
      const articles = res.data;
      this.newsCount = articles.length;

      const badge = this.el?.querySelector("#news-count-badge");
      if (badge) badge.textContent = String(this.newsCount);

      const radarText = this.el?.querySelector("#radar-text");
      if (radarText && articles.length > 0) {
        const top = articles[0];
        radarText.innerHTML = escapeHtml(top.title);
      }
    } catch {
      // silently fail
    }
  }

  refresh(): void {
    this.loadRadar();
  }
}
