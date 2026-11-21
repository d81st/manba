import { describe, expect, it } from "vitest";
import { ayahInSura } from "./quran.ayah-jump";

describe("ayahInSura", () => {
  it("accepts an ayah of this sura, including Arabic-Indic digits", () => {
    expect(ayahInSura("255", 286)).toBe(255);
    expect(ayahInSura("  1 ", 7)).toBe(1);
    expect(ayahInSura("٢٥٥", 286)).toBe(255);
    expect(ayahInSura("۲۵۵", 286)).toBe(255);
  });

  it("refuses a number this sura does not have", () => {
    expect(ayahInSura("0", 7)).toBeNull();
    expect(ayahInSura("8", 7)).toBeNull();
    expect(ayahInSura("286", 7)).toBeNull();
    expect(ayahInSura("", 286)).toBeNull();
    expect(ayahInSura("2:255", 286)).toBeNull();
    expect(ayahInSura("١٢a", 286)).toBeNull();
  });
});
