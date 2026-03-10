import { escapeHtml, sanitizeUrl } from "../utils/sanitize";
import type { ApiClient } from "../services/api-client";

type Platform = "youtube" | "twitter" | "reddit" | "tiktok" | "facebook";

interface SocialFeedItem {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  author: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
}

interface PlatformTab {
  id: Platform;
  label: string;
}

const PLATFORM_TABS: PlatformTab[] = [
  { id: "youtube", label: "YOUTUBE" },
  { id: "twitter", label: "X / TWITTER" },
  { id: "reddit", label: "REDDIT" },
  { id: "tiktok", label: "TIKTOK" },
  { id: "facebook", label: "FACEBOOK" },
];

const SOCIAL_LINKS: Record<Platform, { name: string; url: string }[]> = {
  youtube: [
    { name: "ABS-CBN News", url: "https://www.youtube.com/@ABSCBNNews" },
    { name: "GMA Integrated News", url: "https://www.youtube.com/@GMAIntegratedNews" },
    { name: "CNN Philippines", url: "https://www.youtube.com/@CNNPhilippines" },
    { name: "PTV Philippines", url: "https://www.youtube.com/@PTVPhilippines" },
    { name: "Rappler", url: "https://www.youtube.com/@RapplerDotCom" },
    { name: "Inquirer.net", url: "https://www.youtube.com/@inquaboretirerdotnet" },
    { name: "UNTV News", url: "https://www.youtube.com/@UNTVNewsandRescue" },
    { name: "One News PH", url: "https://www.youtube.com/@OneNewsPH" },
  ],
  twitter: [
    { name: "Inquirer", url: "https://x.com/inquaboretirerdotnet" },
    { name: "Rappler", url: "https://x.com/RapplerDotCom" },
    { name: "ABS-CBN News", url: "https://x.com/ABSCBNNews" },
    { name: "GMA News", url: "https://x.com/gaboretmanews" },
    { name: "PhilStar", url: "https://x.com/PhilstarNews" },
    { name: "Manila Bulletin", url: "https://x.com/manilabulletin" },
    { name: "CNN Philippines", url: "https://x.com/caboretnnphilippines" },
    { name: "PH Coast Guard", url: "https://x.com/PCGadminPAO" },
    { name: "PAGASA", url: "https://x.com/daboretost_pagasa" },
    { name: "NDRRMC", url: "https://x.com/ABORETNDRRMC" },
  ],
  reddit: [
    { name: "r/Philippines", url: "https://www.reddit.com/r/Philippines/" },
    { name: "r/phnews", url: "https://www.reddit.com/r/phnews/" },
    { name: "r/Philippine_Senators", url: "https://www.reddit.com/r/Philippine_Senators/" },
    { name: "r/Pilipinas", url: "https://www.reddit.com/r/Pilipinas/" },
  ],
  tiktok: [
    { name: "ABS-CBN News", url: "https://www.tiktok.com/@abscbnnews" },
    { name: "GMA News", url: "https://www.tiktok.com/@gmanews" },
    { name: "Rappler", url: "https://www.tiktok.com/@rapaboretplerdotcom" },
    { name: "Inquirer.net", url: "https://www.tiktok.com/@inquaboretirerdotnet" },
    { name: "CNN Philippines", url: "https://www.tiktok.com/@cnnphilippines" },
    { name: "PTV", url: "https://www.tiktok.com/@ptvph" },
    { name: "UNTV", url: "https://www.tiktok.com/@untvnewsrescue" },
  ],
  facebook: [
    { name: "ABS-CBN News", url: "https://www.facebook.com/ABSCBNNews" },
    { name: "GMA News", url: "https://www.facebook.com/gmanews" },
    { name: "Rappler", url: "https://www.facebook.com/rapaboretplerdotcom" },
    { name: "Inquirer.net", url: "https://www.facebook.com/inquaboretirerdotnet" },
    { name: "PhilStar", url: "https://www.facebook.com/PhilStarNews" },
    { name: "Manila Bulletin", url: "https://www.facebook.com/manilabulletin" },
    { name: "CNN Philippines", url: "https://www.facebook.com/CNNPhilippines" },
    { name: "NDRRMC", url: "https://www.facebook.com/OfficialNDRRMC" },
    { name: "PAGASA-DOST", url: "https://www.facebook.com/ABORETPAGASA" },
  ],
};

export class LiveNewsPanel {
  private api: ApiClient;
  private el: HTMLElement | null = null;
  private activePlatform: Platform = "youtube";
  private feedItems: SocialFeedItem[] = [];
  private activeVideoId: string | null = null;
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
    this.loadSocialFeeds();
    return el;
  }

  private buildHTML(): string {
    const tabs = PLATFORM_TABS.map(
      (tab) =>
        `<button class="channel-tab${tab.id === this.activePlatform ? " active" : ""}" data-platform="${tab.id}">${tab.label}</button>`
    ).join("");

    return `
      <div class="panel-header">
        <h2 class="panel-title">SOCIAL & VIDEO FEEDS</h2>
        <span class="panel-badge live" id="social-feed-badge">${this.newsCount}</span>
      </div>
      <div class="channel-tabs">${tabs}</div>
      <div class="video-container" id="social-feed-container">
        ${this.buildPlatformContent()}
      </div>
      <div class="radar-overlay" id="radar-overlay">
        <span class="radar-label">ON OUR RADAR</span>
        <span class="radar-text" id="radar-text">Loading...</span>
      </div>
    `;
  }

  private buildPlatformContent(): string {
    if (this.activePlatform === "youtube" && this.activeVideoId) {
      return `<iframe
        id="social-video-iframe"
        src="https://www.youtube.com/embed/${escapeHtml(this.activeVideoId)}?autoplay=1&mute=1"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen
      ></iframe>`;
    }

    const platformItems = this.feedItems.filter((item) => item.platform === this.activePlatform);
    if (platformItems.length > 0) {
      const items = platformItems.slice(0, 8);
      return `<div class="social-feed-list">${items.map((item) => this.buildFeedItem(item)).join("")}</div>`;
    }

    return this.buildQuickLinks();
  }

  private buildFeedItem(item: SocialFeedItem): string {
    const safeUrl = sanitizeUrl(item.url);
    const safeTitle = escapeHtml(item.title);
    const safeAuthor = escapeHtml(item.author);
    const timeStr = item.publishedAt ? this.formatTime(item.publishedAt) : "";
    const platformIcon = this.getPlatformIcon(item.platform);

    if (item.platform === "youtube" && item.videoId) {
      return `<div class="social-feed-item social-feed-video" data-video-id="${escapeHtml(item.videoId)}">
        <div class="social-feed-thumb">
          ${item.thumbnailUrl ? `<img src="${sanitizeUrl(item.thumbnailUrl)}" alt="" loading="lazy" />` : `<span class="thumb-placeholder">${platformIcon}</span>`}
          <span class="play-icon">&#9654;</span>
        </div>
        <div class="social-feed-meta">
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="social-feed-title">${safeTitle}</a>
          <span class="social-feed-source">${platformIcon} ${safeAuthor} ${timeStr ? `&middot; ${timeStr}` : ""}</span>
        </div>
      </div>`;
    }

    return `<div class="social-feed-item">
      <div class="social-feed-meta">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="social-feed-title">${safeTitle}</a>
        <span class="social-feed-source">${platformIcon} ${safeAuthor} ${timeStr ? `&middot; ${timeStr}` : ""}</span>
      </div>
    </div>`;
  }

  private buildQuickLinks(): string {
    const links = SOCIAL_LINKS[this.activePlatform] || [];
    const platformIcon = this.getPlatformIcon(this.activePlatform);
    const items = links
      .map(
        (link) =>
          `<a href="${sanitizeUrl(link.url)}" target="_blank" rel="noopener noreferrer" class="social-quick-link">${platformIcon} ${escapeHtml(link.name)}</a>`
      )
      .join("");

    return `<div class="social-quick-links">
      <span class="social-quick-label">PH NEWS ON ${escapeHtml(this.activePlatform.toUpperCase())}</span>
      <div class="social-quick-grid">${items}</div>
    </div>`;
  }

  private getPlatformIcon(platform: Platform): string {
    switch (platform) {
      case "youtube": return "&#9654;";
      case "twitter": return "&#120143;";
      case "reddit": return "&#9673;";
      case "tiktok": return "&#9835;";
      case "facebook": return "&#402;";
      default: return "";
    }
  }

  private formatTime(isoStr: string): string {
    const date = new Date(isoStr);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d`;
  }

  private attachEvents(el: HTMLElement): void {
    el.querySelectorAll<HTMLButtonElement>(".channel-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const platformId = btn.dataset.platform as Platform;
        if (!platformId) return;

        this.activePlatform = platformId;
        this.activeVideoId = null;
        el.querySelectorAll(".channel-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.updateContent();
      });
    });

    el.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(".social-feed-video");
      if (target?.dataset.videoId) {
        e.preventDefault();
        this.activeVideoId = target.dataset.videoId;
        this.updateContent();
      }
    });
  }

  private updateContent(): void {
    const container = this.el?.querySelector("#social-feed-container");
    if (container) {
      container.innerHTML = this.buildPlatformContent();
    }
  }

  private async loadSocialFeeds(): Promise<void> {
    try {
      const res = await this.api.getSocialFeeds();
      this.feedItems = res.data;
      this.newsCount = this.feedItems.length;

      const badge = this.el?.querySelector("#social-feed-badge");
      if (badge) badge.textContent = String(this.newsCount);

      this.updateContent();
    } catch {
      // Fall back to quick links (already rendered)
    }

    this.loadRadar();
  }

  private async loadRadar(): Promise<void> {
    try {
      const res = await this.api.getNews();
      const articles = res.data;

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
    this.loadSocialFeeds();
  }
}
