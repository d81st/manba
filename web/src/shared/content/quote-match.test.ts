import { describe, expect, it } from "vitest";
import { arabicQuotes, findQuote, withHighlight } from "./quote-match";

// Fictional test data: not real quotations.
describe("quotations of a topic", () => {
  it("takes the Arabic words in guillemets, once each", () => {
    expect(arabicQuotes("Слова «نص أول» и «перевод» (Адрес 1:2); снова «نص أول», затем «نص ثان».")).toEqual(["نص أول", "نص ثان"]);
  });

  it("adds the words to a link before its anchor", () => {
    expect(withHighlight("/library/x/s/2?page=3#p-1-2", "نص")).toBe(`/library/x/s/2?page=3&hl=${encodeURIComponent("نص")}#p-1-2`);
    expect(withHighlight("/hadith/bukhari/1", "نص")).toBe(`/hadith/bukhari/1?hl=${encodeURIComponent("نص")}`);
  });
});

describe("findQuote", () => {
  it("finds words cut over pieces and lines", () => {
    expect(findQuote(["قبل نص ", "أول\nبعد"], "نص أول")).toEqual({ start: { piece: 0, offset: 4 }, end: { piece: 1, offset: 3 } });
  });

  it("gives nothing when the words are not there", () => {
    expect(findQuote(["نص آخر"], "نص أول")).toBeNull();
    expect(findQuote(["نص"], "  ")).toBeNull();
  });
});
