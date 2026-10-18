import { describe, expect, it } from "vitest";
import { checkTermInput, formatRefs, linkAddresses, parseRefs, slugify } from "./glossary-input";

// Fictional term data: test values only, not glossary content.
const valid = {
  slug: "test-term",
  arabic: "مصطلح",
  transliteration: "Test term",
  translation: "Тестовый термин",
  short: "Вымышленное определение для теста.",
  status: "draft",
};

describe("slugify", () => {
  it("makes a latin id from a transliteration", () => {
    expect(slugify("Nāsikh")).toBe("nasikh");
    expect(slugify("Ahl al-Kitāb")).toBe("ahl-al-kitab");
    expect(slugify("ʿIlm al-ḥadīth")).toBe("ilm-al-hadith");
    expect(slugify("2 words")).toBe("t-2-words");
    expect(slugify("  ")).toBe("");
  });

  it("transliterates Russian titles", () => {
    expect(slugify("Джихад и война")).toBe("dzhikhad-i-voyna");
    expect(slugify("История текста Корана")).toBe("istoriya-teksta-korana");
  });
});

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

describe("checkTermInput", () => {
  it("accepts a minimal term", () => {
    const { input, problems } = checkTermInput(valid);
    expect(problems).toEqual([]);
    expect(input).toMatchObject({ slug: "test-term", definitions: [], related: [], basicOrder: null });
  });

  it("names the missing fields", () => {
    const { problems } = checkTermInput({ ...valid, arabic: " ", slug: "Bad Slug" });
    expect(problems.map((p) => [p.field, p.code])).toEqual([
      ["slug", "slug"],
      ["arabic", "arabic"],
    ]);
  });

  it("checks references and the first-terms order", () => {
    const { problems } = checkTermInput({
      ...valid,
      refs: "2:106, x",
      isBasic: true,
      definitions: [{ holder: "Тест", recognition: "tradition", text: "Вымышленный текст", refs: "999:1" }],
    });
    expect(problems).toEqual([
      { field: "refs", code: "refs", detail: "x" },
      { field: "definitions.0.refs", code: "refs", detail: "999:1" },
      { field: "basicOrder", code: "basicOrder" },
    ]);
  });
});
