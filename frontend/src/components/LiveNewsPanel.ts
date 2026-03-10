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
  { id: "cnn-ph", name: "CNN PH", ytChannel: "UCeEj9SKvxkOTkmGmFSMredQ" },
  { id: "ptv", name: "PTV", ytChannel: "UCm1oP_sg26QBKAC4UGFjMhA" },
  { id: "rappler", name: "RAPPLER", ytChannel: "UCiNfMdFmMnMHFGNRsaRwISA" },
];

export class LiveNewsPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;
  private activeChannel = LIVE_CHANNELS[0];
  private newsCount = 0;
  // radar element reference managed via DOM queries

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
      <div class="video-container">
        <iframe
          id="live-video-iframe"
          src="https://www.youtube.com/embed/live_stream?channel=${this.activeChannel.ytChannel}&autoplay=1&mute=1"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
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

        const iframe = el.querySelector<HTMLIFrameElement>("#live-video-iframe");
        if (iframe) {
          iframe.src = `https://www.youtube.com/embed/live_stream?channel=${channel.ytChannel}&autoplay=1&mute=1`;
        }
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
