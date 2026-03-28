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
  { city: "Metro Manila", regionId: "manila", gasoline: { low: 60.50, high: 68.75 }, diesel: { low: 54.20, high: 61.50 }, asOf: "2026-03" },
  { city: "Cebu", regionId: "cebu", gasoline: { low: 62.00, high: 70.00 }, diesel: { low: 55.50, high: 63.00 }, asOf: "2026-03" },
  { city: "Davao", regionId: "davao", gasoline: { low: 63.00, high: 71.00 }, diesel: { low: 56.00, high: 64.00 }, asOf: "2026-03" },
  { city: "Iloilo", regionId: "iloilo", gasoline: { low: 63.50, high: 71.50 }, diesel: { low: 56.50, high: 64.50 }, asOf: "2026-03" },
  { city: "Zamboanga", regionId: "zamboanga", gasoline: { low: 65.00, high: 73.00 }, diesel: { low: 58.00, high: 66.00 }, asOf: "2026-03" },
  { city: "CDO", regionId: "cdo", gasoline: { low: 63.00, high: 71.00 }, diesel: { low: 56.00, high: 64.00 }, asOf: "2026-03" },
  { city: "Baguio", regionId: "baguio", gasoline: { low: 64.00, high: 72.00 }, diesel: { low: 57.00, high: 65.00 }, asOf: "2026-03" },
  { city: "Tacloban", regionId: "tacloban", gasoline: { low: 65.00, high: 73.50 }, diesel: { low: 58.00, high: 66.50 }, asOf: "2026-03" },
  { city: "Legazpi", regionId: "legazpi", gasoline: { low: 64.50, high: 72.50 }, diesel: { low: 57.50, high: 65.50 }, asOf: "2026-03" },
  { city: "Palawan", regionId: "palawan", gasoline: { low: 66.00, high: 74.00 }, diesel: { low: 59.00, high: 67.00 }, asOf: "2026-03" },
];
