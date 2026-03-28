export interface CityConfig {
  id: string;
  name: string;
  lat: number;
  lon: number;
  keywords: string[];
}

export const PH_CITIES: CityConfig[] = [
  { id: "manila", name: "Manila", lat: 14.5995, lon: 120.9842, keywords: ["manila", "metro manila", "ncr", "quezon city", "makati", "pasig", "taguig", "pasay", "caloocan", "malabon", "marikina", "muntinlupa", "las piñas", "parañaque", "valenzuela", "san juan", "mandaluyong", "navotas", "pateros", "malacañang", "bgc", "edsa"] },
  { id: "cebu", name: "Cebu", lat: 10.3157, lon: 123.8854, keywords: ["cebu", "lapu-lapu", "mandaue", "talisay", "danao", "carcar", "mactan"] },
  { id: "davao", name: "Davao", lat: 7.1907, lon: 125.4553, keywords: ["davao", "digos", "tagum", "panabo", "davao del sur", "davao del norte", "davao oriental", "davao de oro"] },
  { id: "zamboanga", name: "Zamboanga", lat: 6.9214, lon: 122.079, keywords: ["zamboanga", "basilan", "sulu", "tawi-tawi", "jolo", "isabela city"] },
  { id: "iloilo", name: "Iloilo", lat: 10.7202, lon: 122.5621, keywords: ["iloilo", "bacolod", "negros", "panay", "roxas city", "capiz", "aklan", "antique", "guimaras"] },
  { id: "cdo", name: "Cagayan de Oro", lat: 8.4542, lon: 124.6319, keywords: ["cagayan de oro", "cdo", "bukidnon", "misamis", "iligan", "ozamiz", "malaybalay"] },
  { id: "baguio", name: "Baguio", lat: 16.4023, lon: 120.596, keywords: ["baguio", "benguet", "cordillera", "mountain province", "ifugao", "kalinga", "apayao", "abra", "la trinidad"] },
  { id: "tacloban", name: "Tacloban", lat: 11.2543, lon: 124.96, keywords: ["tacloban", "leyte", "samar", "eastern visayas", "ormoc", "eastern samar", "northern samar", "southern leyte", "biliran"] },
  { id: "legazpi", name: "Legazpi", lat: 13.1391, lon: 123.7438, keywords: ["legazpi", "bicol", "albay", "sorsogon", "camarines", "naga city", "masbate", "catanduanes", "bicolandia"] },
  { id: "palawan", name: "Palawan", lat: 9.8349, lon: 118.7384, keywords: ["palawan", "puerto princesa", "el nido", "coron"] },
  { id: "pampanga", name: "Pampanga", lat: 15.0794, lon: 120.62, keywords: ["pampanga", "angeles city", "clark", "tarlac", "subic", "olongapo", "zambales", "bataan", "bulacan", "malolos", "meycauayan"] },
  { id: "pangasinan", name: "Pangasinan", lat: 16.0433, lon: 120.3333, keywords: ["pangasinan", "dagupan", "lingayen", "la union", "ilocos", "vigan", "laoag", "san fernando"] },
  { id: "cotabato", name: "Cotabato", lat: 7.2236, lon: 124.2464, keywords: ["cotabato", "barmm", "bangsamoro", "marawi", "lanao", "maguindanao", "shariff kabunsuan"] },
  { id: "gensan", name: "General Santos", lat: 6.1164, lon: 125.1716, keywords: ["general santos", "gensan", "sarangani", "south cotabato", "sultan kudarat", "koronadal"] },
  { id: "butuan", name: "Butuan", lat: 8.9475, lon: 125.5406, keywords: ["butuan", "agusan", "surigao", "caraga", "bislig", "tandag"] },
];
