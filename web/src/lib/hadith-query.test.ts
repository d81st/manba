import { describe, expect, it } from "vitest";
import { linkAddresses } from "./glossary-input.ts";
import { parseHadithQuery } from "./hadith-query.ts";

describe("parseHadithQuery", () => {
  it("reads numbers with or without a collection name", () => {
    expect(parseHadithQuery("3951")).toEqual({ kind: "number", work: "bukhari", number: 3951 });
    expect(parseHadithQuery("Бухари 3951")).toEqual({ kind: "number", work: "bukhari", number: 3951 });
    expect(parseHadithQuery("аль-Бухари № 12")).toEqual({ kind: "number", work: "bukhari", number: 12 });
    expect(parseHadithQuery("bukhari.7563")).toEqual({ kind: "number", work: "bukhari", number: 7563 });
    expect(parseHadithQuery("٣٩٥١")).toEqual({ kind: "number", work: "bukhari", number: 3951 });
  });

  it("reads Arabic words in the search form", () => {
    expect(parseHadithQuery("الأعمال بالنيات")).toEqual({ kind: "text", words: ["الاعمال", "بالنيات"], diacritics: false });
  });

  it("does not search in other languages yet", () => {
    expect(parseHadithQuery("намерения")).toEqual({ kind: "unsupported" });
    expect(parseHadithQuery("Муслим 1731")).toEqual({ kind: "unsupported" });
    expect(parseHadithQuery("  ")).toEqual({ kind: "empty" });
  });
});

describe("linkAddresses with hadith references", () => {
  it("links loaded collections next to ayah addresses", () => {
    expect(linkAddresses("См. 3:123 и Сахих аль-Бухари 3951; Муслим 1731.")).toEqual([
      { text: "См. " },
      { sura: 3, from: 123, to: 123, text: "3:123" },
      { text: " и Сахих " },
      { work: "bukhari", number: 3951, text: "аль-Бухари 3951" },
      { text: "; Муслим 1731." },
    ]);
  });
});
