import { describe, it, expect } from "vitest";
import { en } from "../frontend/src/i18n/en";
import { fil } from "../frontend/src/i18n/fil";

describe("i18n translation completeness", () => {
  const enKeys = Object.keys(en).sort();
  const filKeys = Object.keys(fil).sort();

  it("Filipino has all English keys", () => {
    const missing = enKeys.filter((k) => !(k in fil));
    expect(missing).toEqual([]);
  });

  it("English has all Filipino keys", () => {
    const extra = filKeys.filter((k) => !(k in en));
    expect(extra).toEqual([]);
  });

  it("no empty translation values in English", () => {
    const empty = enKeys.filter((k) => en[k as keyof typeof en].trim() === "");
    expect(empty).toEqual([]);
  });

  it("no empty translation values in Filipino", () => {
    const empty = filKeys.filter((k) => fil[k].trim() === "");
    expect(empty).toEqual([]);
  });

  it("key counts match", () => {
    expect(enKeys.length).toBe(filKeys.length);
  });

  it("langToggle values are correct for switching", () => {
    expect(en.langToggle).toBe("FIL");
    expect(fil.langToggle).toBe("ENG");
  });
});
