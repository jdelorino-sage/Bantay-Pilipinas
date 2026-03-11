import { describe, it, expect } from "vitest";
import { getStabilityLevel, StabilityLevel } from "../shared/constants";

describe("WPS Tension Score formula", () => {
  function computeWPSTension(
    vesselIntrusions: number,
    diplomaticSignals: number,
    militaryActivity: number,
    newsVelocity: number
  ) {
    return (
      vesselIntrusions * 0.35 +
      diplomaticSignals * 0.25 +
      militaryActivity * 0.25 +
      newsVelocity * 0.15
    );
  }

  it("returns 0 when all inputs are 0", () => {
    expect(computeWPSTension(0, 0, 0, 0)).toBe(0);
  });

  it("vessel intrusions have highest weight (0.35)", () => {
    const vesselOnly = computeWPSTension(100, 0, 0, 0);
    const diplomaticOnly = computeWPSTension(0, 100, 0, 0);
    expect(vesselOnly).toBeGreaterThan(diplomaticOnly);
    expect(vesselOnly).toBe(35);
    expect(diplomaticOnly).toBe(25);
  });

  it("weights sum to 1.0", () => {
    expect(0.35 + 0.25 + 0.25 + 0.15).toBeCloseTo(1.0);
  });

  it("max score is 100", () => {
    expect(computeWPSTension(100, 100, 100, 100)).toBeCloseTo(100);
  });

  it("moderate tension scenario", () => {
    const score = computeWPSTension(40, 30, 20, 50);
    expect(score).toBeCloseTo(40 * 0.35 + 30 * 0.25 + 20 * 0.25 + 50 * 0.15);
    expect(score).toBeCloseTo(34);
    expect(getStabilityLevel(score)).toBe(StabilityLevel.Guarded);
  });

  it("high tension scenario (Scarborough standoff)", () => {
    const score = computeWPSTension(80, 70, 60, 90);
    expect(score).toBeCloseTo(80 * 0.35 + 70 * 0.25 + 60 * 0.25 + 90 * 0.15);
    expect(score).toBeCloseTo(74);
    expect(getStabilityLevel(score)).toBe(StabilityLevel.Severe);
  });
});
