import { describe, expect, it } from "vitest";
import { analyzeQuestion, missKey, namesMatch, stemRu } from "./assistant-query";

describe("stemRu", () => {
  it("cuts the endings so the forms of a word meet", () => {
    expect(stemRu("джизье")).toBe(stemRu("джизья"));
    expect(stemRu("молитвах")).toBe(stemRu("молитва"));
    expect(stemRu("пост")).toBe("пост");
  });
});

describe("analyzeQuestion", () => {
  it("keeps the words with a subject and drops the rest", () => {
    const { refs, words } = analyzeQuestion("Что говорится о джизье?");
    expect(refs).toEqual([]);
    expect(words.map((w) => w.text)).toEqual(["джизье"]);
  });

  it("reads references written in the question", () => {
    const { refs, words } = analyzeQuestion("что сказано в 2:255 и Бухари 1 о вере");
    expect(refs).toEqual(["quran.2.255", "bukhari.1"]);
    expect(words.map((w) => w.text)).toEqual(["вере"]);
  });

  it("takes Arabic words in their search form", () => {
    const { words } = analyzeQuestion("الصَّلَاة في الكتاب");
    expect(words.map((w) => w.script)).toEqual(["ar", "ar"]);
    expect(words[0].key).not.toMatch(/[ً-ْ]/);
  });

  it("drops repeated words", () => {
    expect(analyzeQuestion("пост постом посты").words).toHaveLength(1);
  });
});

describe("namesMatch", () => {
  const words = analyzeQuestion("когда убили Усмана ибн Аффана").words;
  it("matches a name whose every word is in the question", () => {
    expect(namesMatch("Усман ибн Аффан", words)).toBe(true);
    expect(namesMatch("Усман", words)).toBe(true);
    expect(namesMatch("Али ибн Абу Талиб", words)).toBe(false);
  });
  it("gives a sorted anonymous key", () => {
    expect(missKey(analyzeQuestion("бета альфа"))).toBe(`${stemRu("альфа")} ${stemRu("бета")}`);
  });
});

describe("checkSynonymInput", () => {
  it("normalizes the phrase and splits the forms", async () => {
    const { checkSynonymInput } = await import("./assistant-query");
    expect(checkSynonymInput({ phrase: " Ёлка ", forms: "абв, где\nабв", note: "" })).toEqual({
      input: { phrase: "елка", forms: ["абв", "где"], note: "" },
      problems: [],
    });
    expect(checkSynonymInput({ phrase: "", forms: "", note: "" }).problems.map((p) => p.code)).toEqual(["phrase", "forms"]);
  });
});
