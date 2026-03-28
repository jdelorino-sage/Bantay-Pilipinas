export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  tier: number;
  category: string;
  regionId?: string;
  location?: { lat: number; lon: number };
}

export const PH_FEEDS: FeedConfig[] = [
  // Tier 1 — Wire Services & Official Government
  { id: "pna", name: "Philippine News Agency", url: "https://www.pna.gov.ph/rss.xml", tier: 1, category: "national-politics" },
  { id: "pcg", name: "Philippine Coast Guard", url: "https://www.coastguard.gov.ph/index.php/11-news?format=feed", tier: 1, category: "wps-maritime" },
  { id: "dswd", name: "DSWD", url: "https://www.dswd.gov.ph/feed/", tier: 1, category: "national-politics" },
  { id: "pagasa-rss", name: "PAGASA Weather", url: "https://www.pagasa.dost.gov.ph/rss.xml", tier: 1, category: "disaster" },
  { id: "phivolcs-rss", name: "PHIVOLCS Earthquake", url: "https://earthquake.phivolcs.dost.gov.ph/rss/feed", tier: 1, category: "disaster" },
  { id: "ndrrmc", name: "NDRRMC Updates", url: "https://ndrrmc.gov.ph/rss.xml", tier: 1, category: "disaster" },
  { id: "doh", name: "Department of Health", url: "https://doh.gov.ph/feed", tier: 1, category: "disaster" },

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

  // Tier 3 — Social Media & Community (Reddit, YouTube)
  { id: "reddit-ph", name: "Reddit r/Philippines", url: "https://www.reddit.com/r/Philippines/.rss", tier: 3, category: "national-politics" },
  { id: "reddit-ph-news", name: "Reddit r/PHNews", url: "https://www.reddit.com/r/phnews/.rss", tier: 3, category: "national-politics" },
  { id: "yt-abscbn", name: "ABS-CBN YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCstEtN1GBximQ0ZMy2FE0dA", tier: 3, category: "national-politics" },
  { id: "yt-gma", name: "GMA YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCVPbYEWwYOH5jm6Bvi0XkYg", tier: 3, category: "national-politics" },
  { id: "yt-ptv", name: "PTV YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCm1oP_sg26QBKAC4UGFjMhA", tier: 3, category: "national-politics" },

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

  // ── Regional: Google News Geo RSS per city ──
  { id: "gnews-geo-manila", name: "Local: Manila", url: "https://news.google.com/rss/headlines/section/geo/Manila?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "manila", location: { lat: 14.5995, lon: 120.9842 } },
  { id: "gnews-geo-cebu", name: "Local: Cebu", url: "https://news.google.com/rss/headlines/section/geo/Cebu?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "cebu", location: { lat: 10.3157, lon: 123.8854 } },
  { id: "gnews-geo-davao", name: "Local: Davao", url: "https://news.google.com/rss/headlines/section/geo/Davao?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "davao", location: { lat: 7.1907, lon: 125.4553 } },
  { id: "gnews-geo-zamboanga", name: "Local: Zamboanga", url: "https://news.google.com/rss/headlines/section/geo/Zamboanga?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "zamboanga", location: { lat: 6.9214, lon: 122.079 } },
  { id: "gnews-geo-iloilo", name: "Local: Iloilo", url: "https://news.google.com/rss/headlines/section/geo/Iloilo?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "iloilo", location: { lat: 10.7202, lon: 122.5621 } },
  { id: "gnews-geo-cdo", name: "Local: CDO", url: "https://news.google.com/rss/headlines/section/geo/Cagayan+de+Oro?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "cdo", location: { lat: 8.4542, lon: 124.6319 } },
  { id: "gnews-geo-baguio", name: "Local: Baguio", url: "https://news.google.com/rss/headlines/section/geo/Baguio?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "baguio", location: { lat: 16.4023, lon: 120.596 } },
  { id: "gnews-geo-tacloban", name: "Local: Tacloban", url: "https://news.google.com/rss/headlines/section/geo/Tacloban?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "tacloban", location: { lat: 11.2543, lon: 124.96 } },
  { id: "gnews-geo-legazpi", name: "Local: Legazpi", url: "https://news.google.com/rss/headlines/section/geo/Legazpi?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "legazpi", location: { lat: 13.1391, lon: 123.7438 } },
  { id: "gnews-geo-palawan", name: "Local: Palawan", url: "https://news.google.com/rss/headlines/section/geo/Palawan?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "palawan", location: { lat: 9.8349, lon: 118.7384 } },
  { id: "gnews-geo-bacolod", name: "Local: Bacolod", url: "https://news.google.com/rss/headlines/section/geo/Bacolod?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "iloilo", location: { lat: 10.684, lon: 122.9745 } },
  { id: "gnews-geo-pampanga", name: "Local: Pampanga", url: "https://news.google.com/rss/headlines/section/geo/Pampanga?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "pampanga", location: { lat: 15.0794, lon: 120.62 } },
  { id: "gnews-geo-gensan", name: "Local: GenSan", url: "https://news.google.com/rss/headlines/section/geo/General+Santos?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "gensan", location: { lat: 6.1164, lon: 125.1716 } },
  { id: "gnews-geo-cotabato", name: "Local: Cotabato", url: "https://news.google.com/rss/headlines/section/geo/Cotabato?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "cotabato", location: { lat: 7.2236, lon: 124.2464 } },
  { id: "gnews-geo-butuan", name: "Local: Butuan", url: "https://news.google.com/rss/headlines/section/geo/Butuan?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "butuan", location: { lat: 8.9475, lon: 125.5406 } },

  // ── Regional: Dedicated local news outlets ──
  { id: "sunstar-cebu", name: "SunStar Cebu", url: "https://www.sunstar.com.ph/cebu/rss", tier: 3, category: "regional", regionId: "cebu", location: { lat: 10.3157, lon: 123.8854 } },
  { id: "sunstar-davao", name: "SunStar Davao", url: "https://www.sunstar.com.ph/davao/rss", tier: 3, category: "regional", regionId: "davao", location: { lat: 7.1907, lon: 125.4553 } },
  { id: "sunstar-bacolod", name: "SunStar Bacolod", url: "https://www.sunstar.com.ph/bacolod/rss", tier: 3, category: "regional", regionId: "iloilo", location: { lat: 10.684, lon: 122.9745 } },
  { id: "sunstar-pampanga", name: "SunStar Pampanga", url: "https://www.sunstar.com.ph/pampanga/rss", tier: 3, category: "regional", regionId: "pampanga", location: { lat: 15.0794, lon: 120.62 } },
  { id: "sunstar-zamboanga", name: "SunStar Zamboanga", url: "https://www.sunstar.com.ph/zamboanga/rss", tier: 3, category: "regional", regionId: "zamboanga", location: { lat: 6.9214, lon: 122.079 } },
  { id: "sunstar-baguio", name: "SunStar Baguio", url: "https://www.sunstar.com.ph/baguio/rss", tier: 3, category: "regional", regionId: "baguio", location: { lat: 16.4023, lon: 120.596 } },
  { id: "sunstar-cdo", name: "SunStar CDO", url: "https://www.sunstar.com.ph/cagayan-de-oro/rss", tier: 3, category: "regional", regionId: "cdo", location: { lat: 8.4542, lon: 124.6319 } },
  { id: "panaynews", name: "Panay News", url: "https://www.panaynews.net/feed/", tier: 3, category: "regional", regionId: "iloilo", location: { lat: 10.7202, lon: 122.5621 } },
  { id: "palawan-news", name: "Palawan News", url: "https://palawan-news.com/feed/", tier: 3, category: "regional", regionId: "palawan", location: { lat: 9.8349, lon: 118.7384 } },
];
