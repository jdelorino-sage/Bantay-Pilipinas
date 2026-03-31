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
  // ── Tier 2: Working National Outlets ──
  { id: "inquirer", name: "Inquirer.net", url: "https://newsinfo.inquirer.net/feed", tier: 2, category: "national-politics" },
  { id: "rappler", name: "Rappler", url: "https://www.rappler.com/feed/", tier: 2, category: "national-politics" },
  { id: "rappler-wps", name: "Rappler WPS", url: "https://www.rappler.com/topic/west-philippine-sea/feed/", tier: 2, category: "wps-maritime" },
  { id: "philstar", name: "PhilStar", url: "https://www.philstar.com/rss/nation", tier: 2, category: "national-politics" },
  { id: "philstar-headlines", name: "PhilStar Headlines", url: "https://www.philstar.com/rss/headlines", tier: 2, category: "national-politics" },
  { id: "gma", name: "GMA News Online", url: "https://data.gmanetwork.com/gno/rss/news/feed.xml", tier: 2, category: "national-politics" },
  { id: "gma-regions", name: "GMA Regions", url: "https://data.gmanetwork.com/gno/rss/news/regions/feed.xml", tier: 2, category: "regional" },
  { id: "bworld", name: "BusinessWorld", url: "https://www.bworldonline.com/feed/", tier: 2, category: "economy" },
  { id: "inquirer-social", name: "Inquirer Trending", url: "https://newsinfo.inquirer.net/tag/trending/feed", tier: 2, category: "national-politics" },
  { id: "rappler-social", name: "Rappler Social", url: "https://www.rappler.com/topic/social-media/feed/", tier: 2, category: "national-politics" },
  { id: "deped-feed", name: "DepEd", url: "https://www.deped.gov.ph/feed/", tier: 2, category: "national-politics" },

  // ── Tier 3: Working Specialist & Regional ──
  { id: "mindanews", name: "MindaNews", url: "https://www.mindanews.com/feed/", tier: 3, category: "regional" },
  { id: "panaynews", name: "Panay News", url: "https://www.panaynews.net/feed/", tier: 3, category: "regional", regionId: "iloilo", location: { lat: 10.7202, lon: 122.5621 } },

  // ── Tier 4: Google News National Topics ──
  { id: "gnews-ph", name: "Google News PH", url: "https://news.google.com/rss/search?q=Philippines&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "national-politics" },
  { id: "gnews-wps", name: "Google News WPS", url: "https://news.google.com/rss/search?q=%22West+Philippine+Sea%22&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "wps-maritime" },
  { id: "gnews-typhoon", name: "Google News Typhoon PH", url: "https://news.google.com/rss/search?q=typhoon+Philippines+PAGASA&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-economy", name: "Google News PH Economy", url: "https://news.google.com/rss/search?q=Philippines+economy+peso+BSP&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "economy" },
  { id: "gnews-ofw", name: "Google News OFW", url: "https://news.google.com/rss/search?q=OFW+remittance+Philippines&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "ofw-diaspora" },
  { id: "gnews-disaster", name: "Google News PH Disaster", url: "https://news.google.com/rss/search?q=Philippines+earthquake+volcano+PHIVOLCS&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-military", name: "Google News PH Military", url: "https://news.google.com/rss/search?q=Philippines+military+AFP+EDCA&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "defense" },

  // ── Tier 4: International Coverage ──
  { id: "scmp", name: "South China Morning Post", url: "https://www.scmp.com/rss/91/feed", tier: 4, category: "wps-maritime" },
  { id: "diplomat", name: "The Diplomat", url: "https://thediplomat.com/feed/", tier: 4, category: "defense" },
  { id: "aljazeera-asia", name: "Al Jazeera Asia", url: "https://www.aljazeera.com/xml/rss/all.xml", tier: 4, category: "defense" },
  { id: "bbc-asia", name: "BBC Asia", url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", tier: 4, category: "national-politics" },
  { id: "asia-times", name: "Asia Times", url: "https://asiatimes.com/feed/", tier: 4, category: "defense" },
  { id: "channel-news-asia", name: "Channel NewsAsia", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", tier: 4, category: "defense" },

  // ── Tier 4: Signal Agents (consolidated topic feeds) ──
  { id: "gnews-fuel", name: "Google News Fuel PH", url: "https://news.google.com/rss/search?q=Philippines+fuel+price+diesel+gasoline+DOE&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "economy" },
  { id: "gnews-npa", name: "Google News NPA", url: "https://news.google.com/rss/search?q=NPA+Philippines+insurgent+communist&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "crime" },
  { id: "gnews-abu-sayyaf", name: "Google News Abu Sayyaf", url: "https://news.google.com/rss/search?q=Abu+Sayyaf+Sulu+Basilan+Philippines&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "crime" },
  { id: "gnews-barmm", name: "Google News BARMM", url: "https://news.google.com/rss/search?q=BARMM+Bangsamoro+peace+Mindanao&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "defense" },
  { id: "gnews-afp-ops", name: "Google News AFP Operations", url: "https://news.google.com/rss/search?q=AFP+operations+military+Philippines+encounter&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "defense" },
  { id: "gnews-wps-china", name: "WPS China", url: "https://news.google.com/rss/search?q=China+Philippines+South+China+Sea+coast+guard&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "wps-maritime" },
  { id: "gnews-edca-us", name: "EDCA US Alliance", url: "https://news.google.com/rss/search?q=EDCA+Philippines+US+military+alliance&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "defense" },
  { id: "gnews-inflation", name: "PH Inflation", url: "https://news.google.com/rss/search?q=Philippines+inflation+consumer+prices+PSA&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "economy" },
  { id: "gnews-ofw-remit", name: "OFW Remittances", url: "https://news.google.com/rss/search?q=OFW+remittance+Philippines+overseas+workers&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "ofw-diaspora" },
  { id: "gnews-mmda", name: "MMDA Traffic", url: "https://news.google.com/rss/search?q=MMDA+traffic+Metro+Manila+flood+advisory&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "manila", location: { lat: 14.5995, lon: 120.9842 } },
  { id: "gnews-pnp", name: "PNP Crime", url: "https://news.google.com/rss/search?q=PNP+Philippines+crime+arrest+drug+operation&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "crime" },
  { id: "gnews-crime", name: "Crime Reports", url: "https://news.google.com/rss/search?q=Philippines+crime+murder+robbery+shooting+kidnap&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "crime" },
  { id: "gnews-flood", name: "Flood Warnings", url: "https://news.google.com/rss/search?q=Philippines+flood+warning+NDRRMC+evacuation&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-fire", name: "Fire Incidents", url: "https://news.google.com/rss/search?q=Philippines+fire+BFP+incident+blaze&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-power", name: "Power Outage", url: "https://news.google.com/rss/search?q=Philippines+power+outage+brownout+Meralco&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "economy" },
  { id: "gnews-rice", name: "Rice/Food Prices", url: "https://news.google.com/rss/search?q=Philippines+rice+food+price+increase+vegetable&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "economy" },
  { id: "gnews-transport", name: "Transport Fares", url: "https://news.google.com/rss/search?q=Philippines+fare+increase+jeepney+MRT+LTFRB&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "economy" },
  { id: "gnews-dengue", name: "Dengue/Health", url: "https://news.google.com/rss/search?q=Philippines+dengue+DOH+outbreak+health+alert&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-congress", name: "Congress Bills", url: "https://news.google.com/rss/search?q=Philippines+Congress+Senate+bill+passed+law&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "national-politics" },
  { id: "gnews-gazette", name: "Official Gazette News", url: "https://news.google.com/rss/search?q=site%3Aofficialgazette.gov.ph+Philippines&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "national-politics" },
  { id: "gnews-malacanang", name: "Malacañang", url: "https://news.google.com/rss/search?q=Malaca%C3%B1ang+Palace+Philippines+President+Marcos&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "national-politics" },
  { id: "gnews-bfp", name: "BFP Fire Reports", url: "https://news.google.com/rss/search?q=BFP+%22Bureau+of+Fire+Protection%22+Philippines+fire&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "disaster" },
  { id: "gnews-trending-ph", name: "PH Trending", url: "https://news.google.com/rss/search?q=Philippines+trending+viral&hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "national-politics" },

  // ── Tier 4: Regional Google News Geo RSS per city ──
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
  { id: "gnews-geo-batangas", name: "Local: Batangas", url: "https://news.google.com/rss/headlines/section/geo/Batangas?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "batangas", location: { lat: 13.7565, lon: 121.0583 } },
  { id: "gnews-geo-laguna", name: "Local: Laguna", url: "https://news.google.com/rss/headlines/section/geo/Laguna+Philippines?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "laguna", location: { lat: 14.2691, lon: 121.4113 } },
  { id: "gnews-geo-cavite", name: "Local: Cavite", url: "https://news.google.com/rss/headlines/section/geo/Cavite?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "cavite", location: { lat: 14.4791, lon: 120.897 } },
  { id: "gnews-geo-tuguegarao", name: "Local: Tuguegarao", url: "https://news.google.com/rss/headlines/section/geo/Tuguegarao?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "tuguegarao", location: { lat: 17.6132, lon: 121.727 } },
  { id: "gnews-geo-dumaguete", name: "Local: Dumaguete", url: "https://news.google.com/rss/headlines/section/geo/Dumaguete?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "dumaguete", location: { lat: 9.3068, lon: 123.3054 } },
  { id: "gnews-geo-dagupan", name: "Local: Dagupan", url: "https://news.google.com/rss/headlines/section/geo/Dagupan?hl=en-PH&gl=PH&ceid=PH:en", tier: 4, category: "regional", regionId: "pangasinan", location: { lat: 16.0433, lon: 120.3333 } },
];
