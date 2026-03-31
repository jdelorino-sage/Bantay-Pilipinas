import { escapeHtml } from "../utils/sanitize";
import type { ApiClient } from "../services/api-client";

interface LiveChannel {
  id: string;
  name: string;
  ytChannel: string;
  // Direct embed URL that works without API - channel's latest/featured video
  embedUrl: string;
  liveUrl: string;
}

const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: "abs-cbn", name: "ABS-CBN", ytChannel: "UCstEtN1GBximQ0ZMy2FE0dA",
    embedUrl: "https://www.youtube.com/embed?listType=user_uploads&list=ABSCBNNews",
    liveUrl: "https://www.youtube.com/@ABSCBNNews/live",
  },
  {
    id: "gma", name: "GMA", ytChannel: "UCVPbYEWwYOH5jm6Bvi0XkYg",
    embedUrl: "https://www.youtube.com/embed?listType=user_uploads&list=gabordo7",
    liveUrl: "https://www.youtube.com/@gmanetwork/live",
  },
  {
    id: "ptv", name: "PTV", ytChannel: "UCm1oP_sg26QBKAC4UGFjMhA",
    embedUrl: "https://www.youtube.com/embed?listType=user_uploads&list=PTVPhilippines",
    liveUrl: "https://www.youtube.com/@PTVPhilippines/live",
  },
  {
    id: "onenews", name: "ONE NEWS", ytChannel: "UCupsMUp_wVBbHFjG2GXrwGw",
    embedUrl: "https://www.youtube.com/embed?listType=user_uploads&list=oabordo",
    liveUrl: "https://www.youtube.com/@onenabordo/live",
  },
  {
    id: "untv", name: "UNTV", ytChannel: "UCkMGhq6HKXN8KxGQkHPwCwQ",
    embedUrl: "https://www.youtube.com/embed?listType=user_uploads&list=UntvRadioLaVerdad",
    liveUrl: "https://www.youtube.com/@ABORDO37/live",
  },
  {
    id: "rappler", name: "RAPPLER", ytChannel: "UCiNfMdFmMnMHFGNRsaRwISA",
    embedUrl: "https://www.youtube.com/embed?listType=user_uploads&list=rappabordo",
    liveUrl: "https://www.youtube.com/@rapabordo/live",
  },
];

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
      <div class="video-container" id="video-container">
        <iframe
          id="live-video-iframe"
          src="${this.activeChannel.embedUrl}&autoplay=1&mute=1"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
        <a href="${this.activeChannel.liveUrl}" target="_blank" rel="noopener" class="video-live-link" title="Watch live on YouTube">LIVE \u25B6</a>
      </div>
      <div class="radar-overlay" id="radar-overlay">
        <span class="radar-label">ON OUR RADAR</span>
        <span class="radar-text" id="radar-text">Loading...</span>
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

        const iframe = el.querySelector<HTMLIFrameElement>("#live-video-iframe");
        if (iframe) {
          iframe.src = `${channel.embedUrl}&autoplay=1&mute=1`;
        }

        const liveLink = el.querySelector<HTMLAnchorElement>(".video-live-link");
        if (liveLink) liveLink.href = channel.liveUrl;
      });
    });
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
