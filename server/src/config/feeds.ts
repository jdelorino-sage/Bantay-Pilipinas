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
  { id: "pcg", name: "Philippine Coast Guard", url: "https://www.coastguard.gov.ph/index.php/11-news?format=feed", tier: 1, category: "wps-maritime" },
  { id: "dswd", name: "DSWD", url: "https://www.dswd.gov.ph/feed/", tier: 1, category: "national-politics" },

  // Tier 2 — Major National Outlets
  { id: "inquirer", name: "Inquirer.net", url: "https://newsinfo.inquirer.net/feed", tier: 2, category: "national-politics" },
  { id: "rappler", name: "Rappler", url: "https://www.rappler.com/feed/", tier: 2, category: "national-politics" },
  { id: "rappler-weather", name: "Rappler Weather", url: "https://www.rappler.com/topic/weather/feed/", tier: 2, category: "disaster" },
  { id: "rappler-wps", name: "Rappler WPS", url: "https://www.rappler.com/topic/west-philippine-sea/feed/", tier: 2, category: "wps-maritime" },
  { id: "philstar", name: "PhilStar", url: "https://www.philstar.com/rss/nation", tier: 2, category: "national-politics" },
  { id: "mb", name: "Manila Bulletin", url: "https://mb.com.ph/rss/news", tier: 2, category: "national-politics" },
  { id: "gma", name: "GMA News Online", url: "https://data.gmanetwork.com/gno/rss/news/feed.xml", tier: 2, category: "national-politics" },
  { id: "abs-cbn", name: "ABS-CBN News", url: "https://news.abs-cbn.com/rss.xml", tier: 2, category: "national-politics" },
  { id: "bworld", name: "BusinessWorld", url: "https://www.bworldonline.com/feed/", tier: 2, category: "economy" },
  { id: "bmirror", name: "BusinessMirror", url: "https://businessmirror.com.ph/feed/", tier: 2, category: "economy" },

  // Tier 2 — News Outlet Social/Trending Feeds
  { id: "inquirer-social", name: "Inquirer Trending", url: "https://newsinfo.inquirer.net/tag/trending/feed", tier: 2, category: "national-politics" },
  { id: "rappler-social", name: "Rappler Social", url: "https://www.rappler.com/topic/social-media/feed/", tier: 2, category: "national-politics" },
  { id: "gma-social", name: "GMA Social Media", url: "https://www.gmanetwork.com/news/hashtag/rss/feed.xml", tier: 2, category: "national-politics" },

  // Tier 3 — Specialist & Regional
  { id: "verafiles", name: "Vera Files", url: "https://verafiles.org/feed", tier: 3, category: "national-politics" },
  { id: "mindanews", name: "MindaNews", url: "https://www.mindanews.com/feed/", tier: 3, category: "regional" },
  { id: "sunstar", name: "SunStar", url: "https://www.sunstar.com.ph/rssFeed/0", tier: 3, category: "regional" },
  { id: "manilatimes", name: "The Manila Times", url: "https://www.manilatimes.net/feed/", tier: 3, category: "national-politics" },

  // Tier 3 — Social Media & Community (Reddit, YouTube, TikTok RSS proxies)
  { id: "reddit-ph", name: "Reddit r/Philippines", url: "https://www.reddit.com/r/Philippines/.rss", tier: 3, category: "national-politics" },
  { id: "reddit-ph-news", name: "Reddit r/PHNews", url: "https://www.reddit.com/r/phnews/.rss", tier: 3, category: "national-politics" },
  { id: "reddit-pilipinas", name: "Reddit r/Pilipinas", url: "https://www.reddit.com/r/Pilipinas/.rss", tier: 3, category: "national-politics" },
  { id: "yt-abscbn", name: "ABS-CBN YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCstEtN1GBximQ0ZMy2FE0dA", tier: 3, category: "national-politics" },
  { id: "yt-gma", name: "GMA YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCVPbYEWwYOH5jm6Bvi0XkYg", tier: 3, category: "national-politics" },
  { id: "yt-ptv", name: "PTV YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCm1oP_sg26QBKAC4UGFjMhA", tier: 3, category: "national-politics" },
  { id: "yt-rappler", name: "Rappler YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCiNfMdFmMnMHFGNRsaRwISA", tier: 3, category: "national-politics" },
  { id: "yt-cnnph", name: "CNN PH YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCeEj9SKvxkOTkmGmFSMredQ", tier: 3, category: "national-politics" },
  { id: "yt-inquirer", name: "Inquirer YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCkI4MSujJJGP-n108BgBKRQ", tier: 3, category: "national-politics" },
  { id: "yt-untv", name: "UNTV YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCeaB-mJyLjZGi85CIR6PFpg", tier: 3, category: "national-politics" },
  { id: "yt-onenews", name: "One News PH YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCm0nRQPKqYjE0kD2RAxsVwg", tier: 3, category: "national-politics" },

  // Tier 4 — Google News Aggregation (Philippines-focused)
  { id: "gnews-ph", name: "Google News PH", url: "https://news.google.com/rss/search?q=Philippines&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "national-politics" },
  { id: "gnews-wps", name: "Google News WPS", url: "https://news.google.com/rss/search?q=%22West+Philippine+Sea%22&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "wps-maritime" },
  { id: "gnews-typhoon", name: "Google News Typhoon PH", url: "https://news.google.com/rss/search?q=typhoon+Philippines+PAGASA&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-economy", name: "Google News PH Economy", url: "https://news.google.com/rss/search?q=Philippines+economy+peso+BSP&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "economy" },
  { id: "gnews-ofw", name: "Google News OFW", url: "https://news.google.com/rss/search?q=OFW+remittance+Philippines&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "ofw-diaspora" },
  { id: "gnews-disaster", name: "Google News PH Disaster", url: "https://news.google.com/rss/search?q=Philippines+earthquake+volcano+PHIVOLCS&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-military", name: "Google News PH Military", url: "https://news.google.com/rss/search?q=Philippines+military+AFP+EDCA&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "defense" },

  // Tier 4 — International Coverage
  { id: "scmp", name: "South China Morning Post", url: "https://www.scmp.com/rss/91/feed", tier: 4, category: "wps-maritime" },
  { id: "diplomat", name: "The Diplomat", url: "https://thediplomat.com/feed/", tier: 4, category: "defense" },
  { id: "benarnews", name: "Benar News", url: "https://www.benarnews.org/english/rss/rss.xml", tier: 4, category: "defense" },
  { id: "aljazeera-asia", name: "Al Jazeera Asia", url: "https://www.aljazeera.com/xml/rss/all.xml", tier: 4, category: "defense" },
  { id: "bbc-asia", name: "BBC Asia", url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", tier: 4, category: "national-politics" },
  { id: "asia-times", name: "Asia Times", url: "https://asiatimes.com/feed/", tier: 4, category: "defense" },
  { id: "channel-news-asia", name: "Channel NewsAsia", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", tier: 4, category: "defense" },
];
