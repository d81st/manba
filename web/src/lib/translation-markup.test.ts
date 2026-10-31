import { describe, expect, it } from "vitest";
import { parseTranslation, translationPlain } from "./translation-markup";

// Sample strings are made up for the test (not a source text).
describe("parseTranslation", () => {
  it("splits added words and notes from the text", () => {
    expect(parseTranslation("Абв {где} эж[[Пример.]]. Зи")).toEqual([
      { kind: "text", text: "Абв " },
      { kind: "added", text: "где" },
      { kind: "text", text: " эж" },
      { kind: "note", text: "Пример." },
      { kind: "text", text: ". Зи" },
    ]);
  });

  it("keeps unmatched brackets as text", () => {
    expect(parseTranslation("а { б [[ в")).toEqual([{ kind: "text", text: "а { б [[ в" }]);
  });

  it("gives the plain text without notes", () => {
    expect(translationPlain("Абв {где}[[Пример.]] эж")).toBe("Абв где эж");
  });
});
