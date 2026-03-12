import { describe, it, expect } from "vitest";
import { VesselClassification } from "../shared/constants";
import { classifyVessel } from "../server/src/services/ais-websocket";

describe("classifyVessel", () => {
  describe("Chinese vessels (MID 412-414)", () => {
    it("classifies CCG vessels", () => {
      expect(classifyVessel(412000001, "HAIJING 3501")).toBe(VesselClassification.CCG);
      expect(classifyVessel(413000002, "CCG 5901")).toBe(VesselClassification.CCG);
    });

    it("classifies PLAN naval vessels", () => {
      expect(classifyVessel(412000003, "PLAN DESTROYER")).toBe(VesselClassification.PLAN);
      expect(classifyVessel(412000004, "528")).toBe(VesselClassification.PLAN);
    });

    it("classifies PAFMM militia vessels", () => {
      expect(classifyVessel(412000005, "PAFMM VESSEL")).toBe(VesselClassification.PAFMM);
      expect(classifyVessel(413000006, "MILITIA BOAT")).toBe(VesselClassification.PAFMM);
    });

    it("defaults Chinese vessels to Fishing", () => {
      expect(classifyVessel(414000007, "MIN YUAN 123")).toBe(VesselClassification.Fishing);
      expect(classifyVessel(412000008, null)).toBe(VesselClassification.Fishing);
    });
  });

  describe("Philippine vessels (MID 548)", () => {
    it("classifies PH Navy vessels", () => {
      expect(classifyVessel(548000001, "BRP RAMON ALCARAZ")).toBe(VesselClassification.PHNavy);
      expect(classifyVessel(548000002, "AFP PATROL")).toBe(VesselClassification.PHNavy);
    });

    it("classifies PH Coast Guard vessels", () => {
      expect(classifyVessel(548000003, "PCG VESSEL")).toBe(VesselClassification.PHCoastGuard);
    });

    it("defaults Philippine vessels to Fishing", () => {
      expect(classifyVessel(548000004, "MARIA FISHING")).toBe(VesselClassification.Fishing);
      expect(classifyVessel(548000005, null)).toBe(VesselClassification.Fishing);
    });
  });

  describe("US vessels (MID 338, 366-369)", () => {
    it("classifies US Navy vessels", () => {
      expect(classifyVessel(366000001, "USS CARL VINSON")).toBe(VesselClassification.USNavy);
      expect(classifyVessel(369000002, "USNS MERCY")).toBe(VesselClassification.USNavy);
    });

    it("defaults US vessels to Commercial", () => {
      expect(classifyVessel(338000003, "MAERSK TRADER")).toBe(VesselClassification.Commercial);
      expect(classifyVessel(367000004, null)).toBe(VesselClassification.Commercial);
    });
  });

  describe("other vessels", () => {
    it("classifies fast-moving vessels as Commercial", () => {
      expect(classifyVessel(200000001, "SOME SHIP", 12)).toBe(VesselClassification.Commercial);
    });

    it("classifies slow/stationary unknown vessels as Unknown", () => {
      expect(classifyVessel(200000002, null, 2)).toBe(VesselClassification.Unknown);
      expect(classifyVessel(200000003, null)).toBe(VesselClassification.Unknown);
    });
  });

  describe("MMSI MID extraction", () => {
    it("extracts correct MID from 9-digit MMSI", () => {
      expect(Math.floor(412345678 / 1_000_000)).toBe(412);
      expect(Math.floor(548000000 / 1_000_000)).toBe(548);
      expect(Math.floor(366999999 / 1_000_000)).toBe(366);
    });
  });
});
