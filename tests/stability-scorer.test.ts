import { describe, it, expect } from "vitest";
import {
  getStabilityLevel,
  StabilityLevel,
  RegionId,
  REGION_BASELINES,
} from "../shared/constants";

describe("getStabilityLevel", () => {
  it("returns Low for scores below 20", () => {
    expect(getStabilityLevel(0)).toBe(StabilityLevel.Low);
    expect(getStabilityLevel(19)).toBe(StabilityLevel.Low);
    expect(getStabilityLevel(19.9)).toBe(StabilityLevel.Low);
  });

  it("returns Guarded for scores 20-34", () => {
    expect(getStabilityLevel(20)).toBe(StabilityLevel.Guarded);
    expect(getStabilityLevel(34)).toBe(StabilityLevel.Guarded);
  });

  it("returns Elevated for scores 35-49", () => {
    expect(getStabilityLevel(35)).toBe(StabilityLevel.Elevated);
    expect(getStabilityLevel(49)).toBe(StabilityLevel.Elevated);
  });

  it("returns High for scores 50-69", () => {
    expect(getStabilityLevel(50)).toBe(StabilityLevel.High);
    expect(getStabilityLevel(69)).toBe(StabilityLevel.High);
  });

  it("returns Severe for scores 70+", () => {
    expect(getStabilityLevel(70)).toBe(StabilityLevel.Severe);
    expect(getStabilityLevel(100)).toBe(StabilityLevel.Severe);
  });
});

describe("REGION_BASELINES", () => {
  it("has correct baselines per CLAUDE.md spec", () => {
    expect(REGION_BASELINES[RegionId.NCR]).toBe(15);
    expect(REGION_BASELINES[RegionId.BARMM]).toBe(40);
    expect(REGION_BASELINES[RegionId.WPS]).toBe(35);
    expect(REGION_BASELINES[RegionId.CAR]).toBe(25);
    expect(REGION_BASELINES[RegionId.EVBicol]).toBe(20);
  });

  it("covers all 5 regions", () => {
    const regionIds = Object.values(RegionId);
    expect(regionIds).toHaveLength(5);
    for (const id of regionIds) {
      expect(REGION_BASELINES[id]).toBeDefined();
      expect(typeof REGION_BASELINES[id]).toBe("number");
    }
  });
});

describe("RSI formula", () => {
  function computeRSI(baseline: number, unrest: number, security: number, information: number) {
    return baseline * 0.3 + unrest * 0.25 + security * 0.25 + information * 0.2;
  }

  it("computes NCR baseline-only score correctly", () => {
    const score = computeRSI(15, 0, 0, 0);
    expect(score).toBeCloseTo(4.5);
  });

  it("computes BARMM with high conflict correctly", () => {
    const score = computeRSI(40, 60, 50, 30);
    expect(score).toBeCloseTo(40 * 0.3 + 60 * 0.25 + 50 * 0.25 + 30 * 0.2);
    expect(score).toBeCloseTo(45.5);
  });

  it("max theoretical score is 100", () => {
    const score = computeRSI(100, 100, 100, 100);
    expect(score).toBeCloseTo(100);
  });

  it("weighted sum adds to 1.0", () => {
    expect(0.3 + 0.25 + 0.25 + 0.2).toBeCloseTo(1.0);
  });
});
