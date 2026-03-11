import { describe, it, expect } from "vitest";
import { PH_CENTER, PH_BOUNDS, PH_EEZ_BOUNDS, PH_TIMEZONE } from "../shared/constants";

describe("Philippine geographic constants", () => {
  it("PH_CENTER is within the Philippines", () => {
    expect(PH_CENTER.lat).toBeGreaterThan(4);
    expect(PH_CENTER.lat).toBeLessThan(22);
    expect(PH_CENTER.lon).toBeGreaterThan(116);
    expect(PH_CENTER.lon).toBeLessThan(127);
  });

  it("PH_BOUNDS covers entire archipelago", () => {
    expect(PH_BOUNDS.north).toBeGreaterThanOrEqual(20);
    expect(PH_BOUNDS.south).toBeLessThanOrEqual(5);
    expect(PH_BOUNDS.west).toBeLessThanOrEqual(117);
    expect(PH_BOUNDS.east).toBeGreaterThanOrEqual(126);
  });

  it("EEZ extends beyond land bounds", () => {
    expect(PH_EEZ_BOUNDS.north).toBeGreaterThanOrEqual(PH_BOUNDS.north);
    expect(PH_EEZ_BOUNDS.south).toBeLessThanOrEqual(PH_BOUNDS.south);
    expect(PH_EEZ_BOUNDS.west).toBeLessThanOrEqual(PH_BOUNDS.west);
    expect(PH_EEZ_BOUNDS.east).toBeGreaterThanOrEqual(PH_BOUNDS.east);
  });

  it("EEZ covers WPS features", () => {
    const scarborough = { lat: 15.15, lon: 117.76 };
    const ayungin = { lat: 9.75, lon: 115.87 };
    const pagasa = { lat: 11.05, lon: 114.28 };

    for (const feature of [scarborough, ayungin, pagasa]) {
      expect(feature.lat).toBeGreaterThanOrEqual(PH_EEZ_BOUNDS.south);
      expect(feature.lat).toBeLessThanOrEqual(PH_EEZ_BOUNDS.north);
      expect(feature.lon).toBeGreaterThanOrEqual(PH_EEZ_BOUNDS.west);
      expect(feature.lon).toBeLessThanOrEqual(PH_EEZ_BOUNDS.east);
    }
  });

  it("timezone is PHT (Asia/Manila)", () => {
    expect(PH_TIMEZONE).toBe("Asia/Manila");
  });
});
