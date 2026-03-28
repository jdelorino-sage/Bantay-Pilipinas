// Philippine Exclusive Economic Zone - simplified boundary polygon
// Based on UNCLOS-defined PH EEZ (simplified to ~30 points)
export const PH_EEZ_POLYGON: [number, number][] = [
  [118.0, 21.0], [120.0, 21.5], [122.0, 21.5], [122.5, 20.5],
  [122.5, 19.5], [122.0, 18.5], [122.5, 18.0], [126.5, 18.0],
  [127.0, 16.0], [127.5, 14.0], [127.5, 12.0], [127.0, 10.0],
  [127.0, 8.0], [127.0, 6.0], [126.5, 5.0], [125.5, 5.0],
  [124.0, 5.5], [123.0, 6.0], [122.0, 6.0], [121.0, 5.5],
  [119.5, 6.0], [118.5, 7.0], [117.0, 7.5], [116.0, 9.0],
  [116.0, 11.0], [116.0, 13.0], [116.5, 15.0], [117.0, 17.0],
  [117.0, 19.0], [117.5, 20.0], [118.0, 21.0],
];

// Major shipping lanes in and around the Philippines
export const SHIPPING_LANES: { id: string; name: string; path: [number, number][] }[] = [
  {
    id: "manila-intl",
    name: "Manila International Shipping Lane",
    path: [[118.0, 15.0], [119.5, 14.8], [120.5, 14.6], [120.96, 14.58]],
  },
  {
    id: "san-bernardino-strait",
    name: "San Bernardino Strait",
    path: [[124.0, 12.7], [124.5, 12.5], [125.0, 12.6], [125.5, 12.8]],
  },
  {
    id: "surigao-strait",
    name: "Surigao Strait",
    path: [[125.5, 10.0], [125.3, 9.8], [125.0, 9.5], [124.8, 9.3]],
  },
  {
    id: "mindoro-strait",
    name: "Mindoro Strait",
    path: [[120.0, 13.5], [120.2, 12.8], [120.5, 12.0], [120.8, 11.5]],
  },
  {
    id: "cebu-bohol-strait",
    name: "Cebu-Bohol Strait",
    path: [[123.5, 10.5], [123.8, 10.3], [124.0, 10.0], [124.2, 9.8]],
  },
  {
    id: "balabac-strait",
    name: "Balabac Strait",
    path: [[117.0, 8.0], [117.2, 7.8], [117.5, 7.5]],
  },
  {
    id: "sulu-sea-lane",
    name: "Sulu Sea Lane",
    path: [[119.0, 10.0], [119.5, 9.0], [120.0, 8.0], [120.5, 7.0], [121.0, 6.5]],
  },
];

// Flood-prone areas (simplified polygons for major flood zones)
export const FLOOD_ZONES: { id: string; name: string; polygon: [number, number][] }[] = [
  {
    id: "metro-manila-flood",
    name: "Metro Manila Flood Zone",
    polygon: [[120.9, 14.4], [121.1, 14.4], [121.1, 14.7], [120.9, 14.7], [120.9, 14.4]],
  },
  {
    id: "pampanga-flood",
    name: "Pampanga River Basin",
    polygon: [[120.5, 14.8], [121.0, 14.8], [121.0, 15.2], [120.5, 15.2], [120.5, 14.8]],
  },
  {
    id: "cagayan-valley-flood",
    name: "Cagayan Valley Flood Plain",
    polygon: [[121.4, 17.0], [122.0, 17.0], [122.0, 18.0], [121.4, 18.0], [121.4, 17.0]],
  },
  {
    id: "cotabato-flood",
    name: "Cotabato Basin Flood Zone",
    polygon: [[124.0, 6.8], [124.6, 6.8], [124.6, 7.4], [124.0, 7.4], [124.0, 6.8]],
  },
  {
    id: "agusan-marsh",
    name: "Agusan Marsh Wildlife Sanctuary",
    polygon: [[125.7, 8.2], [126.1, 8.2], [126.1, 8.6], [125.7, 8.6], [125.7, 8.2]],
  },
];

// Weather code descriptions (WMO weather interpretation codes for Open-Meteo)
export const WEATHER_CODES: Record<number, string> = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Rime Fog",
  51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
  71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
  80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
  95: "Thunderstorm", 96: "Thunderstorm + Hail", 99: "Severe Thunderstorm",
};
