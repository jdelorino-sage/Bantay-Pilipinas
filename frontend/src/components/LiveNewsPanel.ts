import { escapeHtml } from "../utils/sanitize";
import type { ApiClient } from "../services/api-client";

interface LiveChannel {
  id: string;
  name: string;
  ytChannel: string;
  liveVideoId?: string;
}

const LIVE_CHANNELS: LiveChannel[] = [
  { id: "abs-cbn", name: "ABS-CBN", ytChannel: "UCstEtN1GBximQ0ZMy2FE0dA", liveVideoId: "cEFSANcb430" },
  { id: "gma", name: "GMA", ytChannel: "UCVPbYEWwYOH5jm6Bvi0XkYg", liveVideoId: "4aHDBsg68Wc" },
  { id: "cnn-ph", name: "CNN PH", ytChannel: "UCeEj9SKvxkOTkmGmFSMredQ" },
  { id: "ptv", name: "PTV", ytChannel: "UCm1oP_sg26QBKAC4UGFjMhA", liveVideoId: "2EmkF-Mxm1s" },
  { id: "rappler", name: "RAPPLER", ytChannel: "UCiNfMdFmMnMHFGNRsaRwISA" },
];

function buildEmbedUrl(channel: LiveChannel): string {
  if (channel.liveVideoId) {
    return `https://www.youtube.com/embed/${channel.liveVideoId}?autoplay=1&mute=1&rel=0`;
  }
  return `https://www.youtube.com/embed/live_stream?channel=${channel.ytChannel}&autoplay=1&mute=1`;
}

export class LiveNewsPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;
  private activeChannel = LIVE_CHANNELS[0];
  private newsCount = 0;
  private iframeLoadFailed = false;

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
    this.monitorIframe(el);
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
          src="${buildEmbedUrl(this.activeChannel)}"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
        <div class="video-fallback hidden" id="video-fallback">
          <span class="fallback-icon">&#x1F4FA;</span>
          <span class="fallback-text">Live stream unavailable</span>
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
        this.iframeLoadFailed = false;
        el.querySelectorAll(".channel-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const iframe = el.querySelector<HTMLIFrameElement>("#live-video-iframe");
        const fallback = el.querySelector<HTMLElement>("#video-fallback");
        if (iframe) {
          iframe.classList.remove("hidden");
          iframe.src = buildEmbedUrl(channel);
        }
        if (fallback) {
          fallback.classList.add("hidden");
          const link = fallback.querySelector<HTMLAnchorElement>(".fallback-link");
          if (link) link.href = `https://www.youtube.com/channel/${channel.ytChannel}/live`;
        }

        this.monitorIframe(el);
      });
    });
  }

  private monitorIframe(el: HTMLElement): void {
    const iframe = el.querySelector<HTMLIFrameElement>("#live-video-iframe");
    const fallback = el.querySelector<HTMLElement>("#video-fallback");
    if (!iframe || !fallback) return;

    const timer = setTimeout(() => {
      if (!this.iframeLoadFailed) {
        this.iframeLoadFailed = true;
        if (!this.activeChannel.liveVideoId) {
          iframe.classList.add("hidden");
          fallback.classList.remove("hidden");
        }
      }
    }, 10_000);

    iframe.addEventListener("load", () => {
      clearTimeout(timer);
    }, { once: true });
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
