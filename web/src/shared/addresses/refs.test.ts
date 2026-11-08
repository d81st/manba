import { describe, expect, it } from "vitest";
import { formatRefs, linkAddresses, parseRefs } from "@/shared/addresses/refs";

describe("parseRefs and formatRefs", () => {
  it("reads single ayahs and ranges", () => {
    expect(parseRefs("2:106, 16:101-102\n2:106")).toEqual({
      addresses: ["quran.2.106", "quran.16.101", "quran.16.102"],
      invalid: [],
    });
  });

  it("reports what it cannot read", () => {
    expect(parseRefs("2:106, abc, 115:1, 2:1-200").invalid).toEqual(["abc", "115:1", "2:1-200"]);
  });

  it("formats addresses back, joining consecutive ayahs", () => {
    expect(formatRefs(["quran.2.106", "quran.16.101", "quran.16.102", "quran.16.104"])).toBe(
      "2:106, 16:101-102, 16:104",
    );
    expect(formatRefs([])).toBe("");
  });

  it("reads hadiths of every collection and writes them back the same way", () => {
    const text = "Бухари 3951, аль-Муслим 8b, 2:255, ат-Тирмизи 815а, аль-Кафи 4.60.3, Ахмад 24009/2, Абу Дауд 12";
    const { addresses, invalid } = parseRefs(text);
    expect(addresses).toEqual([
      "bukhari.3951",
      "muslim.8.2",
      "quran.2.255",
      "tirmidhi.815.1",
      "kafi.4.60.3",
      "ahmad.24009.2",
      "abu_dawud.12",
    ]);
    expect(invalid).toEqual([]);
    expect(formatRefs(addresses)).toBe(
      "Бухари 3951, Муслим 8b, 2:255, Тирмизи 815a, аль-Кафи 4.60.3, Ахмад 24009/2, Абу Дауд 12",
    );
    expect(parseRefs("Муслим 8, Дарими 5, Кафи 4.60b").invalid).toEqual(["Дарими 5", "Кафи 4.60b"]);
  });
});

describe("linkAddresses", () => {
  it("finds ayah addresses in text", () => {
    expect(linkAddresses("См. 2:106 и 16:101-102.")).toEqual([
      { text: "См. " },
      { sura: 2, from: 106, to: 106, text: "2:106" },
      { text: " и " },
      { sura: 16, from: 101, to: 102, text: "16:101-102" },
      { text: "." },
    ]);
  });

  it("leaves impossible addresses and times as text", () => {
    expect(linkAddresses("115:1 и 10:30:15")).toEqual([{ text: "115:1 и 10:30:15" }]);
  });
});
