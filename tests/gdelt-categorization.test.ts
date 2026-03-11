import { describe, it, expect } from "vitest";

function categorizeGDELT(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("wps") || lower.includes("south china sea") || lower.includes("spratlys") || lower.includes("scarborough"))
    return "wps-maritime";
  if (lower.includes("typhoon") || lower.includes("earthquake") || lower.includes("flood") || lower.includes("volcano"))
    return "disaster";
  if (lower.includes("military") || lower.includes("armed forces") || lower.includes("defense"))
    return "defense";
  if (lower.includes("economy") || lower.includes("peso") || lower.includes("inflation") || lower.includes("gdp"))
    return "economy";
  if (lower.includes("ofw") || lower.includes("remittance") || lower.includes("overseas"))
    return "ofw-diaspora";
  return "national-politics";
}

describe("categorizeGDELT", () => {
  it("categorizes WPS/maritime articles", () => {
    expect(categorizeGDELT("China sends ships to South China Sea")).toBe("wps-maritime");
    expect(categorizeGDELT("Philippines protests WPS incursion")).toBe("wps-maritime");
    expect(categorizeGDELT("Scarborough Shoal standoff continues")).toBe("wps-maritime");
    expect(categorizeGDELT("Spratlys dispute escalates")).toBe("wps-maritime");
  });

  it("categorizes disaster articles", () => {
    expect(categorizeGDELT("Typhoon Carina makes landfall")).toBe("disaster");
    expect(categorizeGDELT("6.2 earthquake hits Mindanao")).toBe("disaster");
    expect(categorizeGDELT("Flash flood in Cagayan Valley")).toBe("disaster");
    expect(categorizeGDELT("Mayon volcano erupts")).toBe("disaster");
  });

  it("categorizes defense articles", () => {
    expect(categorizeGDELT("Philippines military modernization")).toBe("defense");
    expect(categorizeGDELT("Armed Forces of the Philippines drill")).toBe("defense");
    expect(categorizeGDELT("Defense secretary visits troops")).toBe("defense");
  });

  it("categorizes economy articles", () => {
    expect(categorizeGDELT("Philippine economy grows 5.7%")).toBe("economy");
    expect(categorizeGDELT("Peso weakens against dollar")).toBe("economy");
    expect(categorizeGDELT("Inflation rate drops to 3.2%")).toBe("economy");
    expect(categorizeGDELT("GDP growth exceeds forecast")).toBe("economy");
  });

  it("categorizes OFW articles", () => {
    expect(categorizeGDELT("OFW remittances hit record high")).toBe("ofw-diaspora");
    expect(categorizeGDELT("Overseas Filipino workers return")).toBe("ofw-diaspora");
    expect(categorizeGDELT("Remittance growth slows")).toBe("ofw-diaspora");
  });

  it("defaults to national-politics", () => {
    expect(categorizeGDELT("Marcos signs new executive order")).toBe("national-politics");
    expect(categorizeGDELT("Senate passes bill on healthcare")).toBe("national-politics");
    expect(categorizeGDELT("Manila news update")).toBe("national-politics");
  });

  it("is case-insensitive", () => {
    expect(categorizeGDELT("TYPHOON ALERT")).toBe("disaster");
    expect(categorizeGDELT("SOUTH CHINA SEA DISPUTE")).toBe("wps-maritime");
    expect(categorizeGDELT("MILITARY EXERCISE")).toBe("defense");
  });

  it("prioritizes WPS over defense when both keywords present", () => {
    expect(categorizeGDELT("Military in South China Sea")).toBe("wps-maritime");
  });
});
