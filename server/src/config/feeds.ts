export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  tier: number;
  category: string;
}

export const PH_FEEDS: FeedConfig[] = [
  // Tier 1 — Wire Services & Official Government
  { id: "pna", name: "Philippine News Agency", url: "https://www.pna.gov.ph/rss.xml", tier: 1, category: "national-politics" },
  { id: "dfa", name: "Department of Foreign Affairs", url: "https://dfa.gov.ph/rss", tier: 1, category: "national-politics" },

  // Tier 1 — Government Social Media / Official Channels
  { id: "pagasa-weather", name: "PAGASA Weather", url: "https://www.pagasa.dost.gov.ph/rss.xml", tier: 1, category: "disaster" },
  { id: "phivolcs-eq", name: "PHIVOLCS Earthquake", url: "https://earthquake.phivolcs.dost.gov.ph/rss/feed", tier: 1, category: "disaster" },
  { id: "ndrrmc", name: "NDRRMC Updates", url: "https://ndrrmc.gov.ph/rss.xml", tier: 1, category: "disaster" },
  { id: "pcg", name: "Philippine Coast Guard", url: "https://www.coastguard.gov.ph/index.php/11-news?format=feed", tier: 1, category: "wps-maritime" },

  // Tier 2 — Major National Outlets
  { id: "inquirer", name: "Inquirer.net", url: "https://newsinfo.inquirer.net/feed", tier: 2, category: "national-politics" },
  { id: "rappler", name: "Rappler", url: "https://www.rappler.com/feed/", tier: 2, category: "national-politics" },
  { id: "rappler-weather", name: "Rappler Weather", url: "https://www.rappler.com/topic/weather/feed/", tier: 2, category: "disaster" },
  { id: "philstar", name: "PhilStar", url: "https://www.philstar.com/rss/nation", tier: 2, category: "national-politics" },
  { id: "mb", name: "Manila Bulletin", url: "https://mb.com.ph/rss/news", tier: 2, category: "national-politics" },
  { id: "gma", name: "GMA News Online", url: "https://data.gmanetwork.com/gno/rss/news/feed.xml", tier: 2, category: "national-politics" },
  { id: "abs-cbn", name: "ABS-CBN News", url: "https://news.abs-cbn.com/rss.xml", tier: 2, category: "national-politics" },
  { id: "bworld", name: "BusinessWorld", url: "https://www.bworldonline.com/feed/", tier: 2, category: "economy" },
  { id: "bmirror", name: "BusinessMirror", url: "https://businessmirror.com.ph/feed/", tier: 2, category: "economy" },

  // Tier 2 — Social Media RSS (News Outlet Social Feeds)
  { id: "inquirer-social", name: "Inquirer Social", url: "https://newsinfo.inquirer.net/tag/trending/feed", tier: 2, category: "national-politics" },
  { id: "rappler-social", name: "Rappler Social", url: "https://www.rappler.com/topic/social-media/feed/", tier: 2, category: "national-politics" },
  { id: "gma-social", name: "GMA Social Media", url: "https://www.gmanetwork.com/news/hashtag/rss/feed.xml", tier: 2, category: "national-politics" },

  // Tier 3 — Specialist & Regional
  { id: "verafiles", name: "Vera Files", url: "https://verafiles.org/feed", tier: 3, category: "national-politics" },
  { id: "mindanews", name: "MindaNews", url: "https://www.mindanews.com/feed/", tier: 3, category: "regional" },
  { id: "sunstar", name: "SunStar", url: "https://www.sunstar.com.ph/rssFeed/0", tier: 3, category: "regional" },
  { id: "manilatimes", name: "The Manila Times", url: "https://www.manilatimes.net/feed/", tier: 3, category: "national-politics" },

  // Tier 4 — Aggregators & International Coverage
  { id: "reuters-ph", name: "Reuters Philippines", url: "https://www.reuters.com/rss/news/philippines", tier: 4, category: "national-politics" },
  { id: "scmp", name: "South China Morning Post", url: "https://www.scmp.com/rss/91/feed", tier: 4, category: "wps-maritime" },
  { id: "diplomat", name: "The Diplomat", url: "https://thediplomat.com/feed/", tier: 4, category: "defense" },
  { id: "benarnews", name: "Benar News", url: "https://www.benarnews.org/english/rss/rss.xml", tier: 4, category: "defense" },
];
