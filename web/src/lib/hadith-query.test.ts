import { describe, expect, it } from "vitest";
import { linkAddresses } from "./glossary-input.ts";
import { hadithAnchor, hadithLabel, hadithPath, parseHadithQuery, parseVariant, variantLetters } from "./hadith-query.ts";

describe("parseHadithQuery", () => {
  it("reads numbers with or without a collection name", () => {
    expect(parseHadithQuery("3951")).toEqual({ kind: "number", work: "bukhari", number: 3951, variant: null });
    expect(parseHadithQuery("Бухари 3951")).toEqual({ kind: "number", work: "bukhari", number: 3951, variant: null });
    expect(parseHadithQuery("аль-Бухари № 12")).toEqual({ kind: "number", work: "bukhari", number: 12, variant: null });
    expect(parseHadithQuery("bukhari.7563")).toEqual({ kind: "number", work: "bukhari", number: 7563, variant: null });
    expect(parseHadithQuery("٣٩٥١")).toEqual({ kind: "number", work: "bukhari", number: 3951, variant: null });
  });

  it("reads narrations of Muslim and a collection chosen on its page", () => {
    expect(parseHadithQuery("Муслим 1731")).toEqual({ kind: "number", work: "muslim", number: 1731, variant: null });
    expect(parseHadithQuery("Муслим 8b")).toEqual({ kind: "number", work: "muslim", number: 8, variant: 2 });
    expect(parseHadithQuery("Сахих Муслима 21а")).toEqual({ kind: "unsupported" });
    expect(parseHadithQuery("Муслима 21б")).toEqual({ kind: "number", work: "muslim", number: 21, variant: 2 });
    expect(parseHadithQuery("muslim.8.3")).toEqual({ kind: "number", work: "muslim", number: 8, variant: 3 });
    expect(parseHadithQuery("8", "muslim")).toEqual({ kind: "number", work: "muslim", number: 8, variant: null });
    expect(parseHadithQuery("Тирмизи 12")).toEqual({ kind: "unsupported" });
  });

  it("reads Arabic words in the search form", () => {
    expect(parseHadithQuery("الأعمال بالنيات")).toEqual({ kind: "text", words: ["الاعمال", "بالنيات"], diacritics: false });
  });

  it("does not search in other languages yet", () => {
    expect(parseHadithQuery("намерения")).toEqual({ kind: "unsupported" });
    expect(parseHadithQuery("  ")).toEqual({ kind: "empty" });
  });
});

describe("linkAddresses with hadith references", () => {
  it("links loaded collections next to ayah addresses", () => {
    expect(linkAddresses("См. 3:123 и Сахих аль-Бухари 3951; Муслим 1731.")).toEqual([
      { text: "См. " },
      { sura: 3, from: 123, to: 123, text: "3:123" },
      { text: " и Сахих " },
      { work: "bukhari", number: 3951, variant: null, text: "аль-Бухари 3951" },
      { text: "; " },
      { work: "muslim", number: 1731, variant: null, text: "Муслим 1731" },
      { text: "." },
    ]);
  });

  it("links narrations by their letter", () => {
    expect(linkAddresses("Муслим 8b, Муслим 21а и Муслим 9ab")).toEqual([
      { work: "muslim", number: 8, variant: 2, text: "Муслим 8b" },
      { text: ", " },
      { work: "muslim", number: 21, variant: 1, text: "Муслим 21а" },
      { text: " и " },
      { work: "muslim", number: 9, variant: 28, text: "Муслим 9ab" },
    ]);
  });
});

describe("narration labels", () => {
  it("counts letters a..z, then aa, ab, ...", () => {
    expect([1, 2, 26, 27, 28, 52, 53].map(variantLetters)).toEqual(["a", "b", "z", "aa", "ab", "az", "ba"]);
    expect(["a", "z", "aa", "ab", "ba", "б", "в"].map(parseVariant)).toEqual([1, 26, 27, 28, 53, 2, 3]);
    expect(parseVariant("abc")).toBeNull();
    expect(parseVariant("ё")).toBeNull();
  });

  it("shows a letter only when a hadith has several narrations", () => {
    expect(hadithLabel(8, 2, 4)).toBe("8b");
    expect(hadithLabel(2937, 1, 1)).toBe("2937");
    expect(hadithLabel(3951, null)).toBe("3951");
    expect(hadithPath("muslim", 8, 2)).toBe("/hadith/muslim/8b");
    expect(hadithPath("bukhari", 3951)).toBe("/hadith/bukhari/3951");
    expect(hadithAnchor(8, 2)).toBe("h-8-2");
    expect(hadithAnchor(3951, null)).toBe("h-3951");
  });
});
