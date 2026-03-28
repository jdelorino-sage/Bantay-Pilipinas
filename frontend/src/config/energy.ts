export interface OilDepot {
  id: string;
  name: string;
  company: string;
  lat: number;
  lon: number;
  type: "refinery" | "terminal" | "depot" | "storage";
  status: "active" | "idle" | "relocating";
  capacityBarrels?: number;
}

export const OIL_DEPOTS: OilDepot[] = [
  { id: "pandacan", name: "Pandacan Oil Depot", company: "Petron/Shell/Chevron", lat: 14.594, lon: 121.007, type: "depot", status: "relocating", capacityBarrels: 2_000_000 },
  { id: "petron-batangas", name: "Petron Batangas Terminal", company: "Petron", lat: 13.759, lon: 120.955, type: "terminal", status: "active" },
  { id: "shell-tabangao", name: "Shell Tabangao Terminal", company: "Shell", lat: 13.750, lon: 120.953, type: "terminal", status: "active" },
  { id: "chevron-sanpascual", name: "Chevron San Pascual", company: "Chevron", lat: 13.787, lon: 121.010, type: "terminal", status: "active", capacityBarrels: 2_500_000 },
  { id: "petron-limay", name: "Petron Bataan Refinery", company: "Petron", lat: 14.530, lon: 120.599, type: "refinery", status: "idle" },
  { id: "philcoastal-subic", name: "Philcoastal Subic Bay", company: "PCSPC", lat: 14.805, lon: 120.288, type: "storage", status: "active", capacityBarrels: 8_000_000 },
  { id: "petron-navotas", name: "Petron Navotas", company: "Petron", lat: 14.667, lon: 120.946, type: "depot", status: "active" },
  { id: "petron-rosario", name: "Petron Rosario Cavite", company: "Petron", lat: 14.413, lon: 120.857, type: "depot", status: "active" },
  { id: "petron-davao", name: "Petron Davao Terminal", company: "Petron", lat: 7.113, lon: 125.656, type: "terminal", status: "active" },
  { id: "chevron-sasa", name: "Chevron Sasa JO Terminal", company: "Chevron", lat: 7.114, lon: 125.656, type: "terminal", status: "active" },
  { id: "seaoil-zamboanga", name: "Seaoil Zamboanga", company: "Seaoil", lat: 6.921, lon: 122.079, type: "terminal", status: "active" },
  { id: "cebu-terminal", name: "Cebu Oil Terminal", company: "Various", lat: 10.315, lon: 123.947, type: "terminal", status: "active" },
  { id: "cdo-terminal", name: "CDO Oil Terminal", company: "Various", lat: 8.481, lon: 124.649, type: "terminal", status: "active" },
];

export interface CityFuelPrice {
  city: string;
  regionId: string;
  gasoline: { low: number; high: number };
  diesel: { low: number; high: number };
  asOf: string;
}

export const FUEL_PRICES: CityFuelPrice[] = [
  { city: "Metro Manila", regionId: "manila", gasoline: { low: 62.95, high: 72.60 }, diesel: { low: 55.40, high: 63.95 }, asOf: "2026-03-25" },
  { city: "Cebu", regionId: "cebu", gasoline: { low: 64.50, high: 73.80 }, diesel: { low: 57.10, high: 65.20 }, asOf: "2026-03-25" },
  { city: "Davao", regionId: "davao", gasoline: { low: 65.20, high: 74.50 }, diesel: { low: 57.80, high: 66.00 }, asOf: "2026-03-25" },
  { city: "Iloilo", regionId: "iloilo", gasoline: { low: 65.80, high: 75.10 }, diesel: { low: 58.30, high: 66.80 }, asOf: "2026-03-25" },
  { city: "Zamboanga", regionId: "zamboanga", gasoline: { low: 67.50, high: 76.90 }, diesel: { low: 59.90, high: 68.40 }, asOf: "2026-03-25" },
  { city: "CDO", regionId: "cdo", gasoline: { low: 65.40, high: 74.70 }, diesel: { low: 57.90, high: 66.20 }, asOf: "2026-03-25" },
  { city: "Baguio", regionId: "baguio", gasoline: { low: 66.20, high: 75.50 }, diesel: { low: 58.60, high: 67.10 }, asOf: "2026-03-25" },
  { city: "Tacloban", regionId: "tacloban", gasoline: { low: 67.80, high: 77.20 }, diesel: { low: 60.10, high: 68.80 }, asOf: "2026-03-25" },
  { city: "Legazpi", regionId: "legazpi", gasoline: { low: 66.90, high: 76.10 }, diesel: { low: 59.20, high: 67.70 }, asOf: "2026-03-25" },
  { city: "Palawan", regionId: "palawan", gasoline: { low: 68.50, high: 78.00 }, diesel: { low: 60.80, high: 69.50 }, asOf: "2026-03-25" },
  { city: "Pampanga", regionId: "pampanga", gasoline: { low: 63.50, high: 73.10 }, diesel: { low: 55.90, high: 64.40 }, asOf: "2026-03-25" },
  { city: "GenSan", regionId: "gensan", gasoline: { low: 66.70, high: 75.90 }, diesel: { low: 59.00, high: 67.50 }, asOf: "2026-03-25" },
];
