import { describe, expect, it } from "vitest";
import { checkTermInput } from "./term.validation";

// Fictional term data: test values only, not glossary content.
const valid = {
  slug: "test-term",
  arabic: "مصطلح",
  transliteration: "Test term",
  translation: "Тестовый термин",
  short: "Вымышленное определение для теста.",
  status: "draft",
};

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
