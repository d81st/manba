import { describe, expect, it } from "vitest";
import { checkSideInput, checkTopicInput, passagesOf } from "./topics-input.ts";

// Fictional test data: not real topics or positions.
const base = {
  slug: "test-topic",
  category: "general",
  status: "draft",
  title: "Тестовая тема",
  question: "Тестовый вопрос?",
};

const position = { sideId: 1, holder: "Тестовая школа", recognition: "minority", text: "Вымышленная позиция." };

describe("checkTopicInput", () => {
  it("accepts a minimal draft", () => {
    const { input, problems } = checkTopicInput(base);
    expect(problems).toEqual([]);
    expect(input?.positions).toEqual([]);
  });

  it("requires a title, a question and a valid slug", () => {
    const { problems } = checkTopicInput({ ...base, slug: "1-bad", title: " ", question: "" });
    expect(problems.map((p) => p.code).sort()).toEqual(["question", "slug", "title"]);
  });

  it("reports unreadable references per field", () => {
    const { problems } = checkTopicInput({
      ...base,
      mainRefs: "9:29, abc",
      positions: [{ ...position, refs: "200:1" }],
    });
    expect(problems).toEqual([
      { field: "mainRefs", code: "refs", detail: "abc" },
      { field: "positions.0.refs", code: "refs", detail: "200:1" },
    ]);
  });

  it("does not publish a hard topic without text, circumstances and a position", () => {
    const { problems } = checkTopicInput({ ...base, category: "hard", status: "published" });
    expect(problems.map((p) => p.code)).toEqual(["mainRequired", "circumstancesRequired", "positionsRequired"]);
  });

  it("publishes a complete hard topic and keeps drafts free", () => {
    const complete = {
      ...base,
      category: "hard",
      status: "published",
      mainRefs: "9:29",
      circumstances: "Вымышленные обстоятельства.",
      positions: [position],
    };
    expect(checkTopicInput(complete).problems).toEqual([]);
    expect(checkTopicInput({ ...base, category: "hard" }).problems).toEqual([]);
  });

  it("does not ask a general topic for positions", () => {
    expect(checkTopicInput({ ...base, status: "published" }).problems).toEqual([]);
  });

  it("drops repeated links", () => {
    const { input } = checkTopicInput({ ...base, terms: [3, 3, 4], related: [7, 7] });
    expect(input?.terms).toEqual([3, 4]);
    expect(input?.related).toEqual([7]);
  });
});

describe("passagesOf", () => {
  it("joins consecutive ayahs of one sura", () => {
    expect(passagesOf(["quran.9.29", "quran.9.30", "quran.2.190", "quran.2.192", "quran.3.1"])).toEqual([
      { sura: 9, from: 29, to: 30 },
      { sura: 2, from: 190, to: 190 },
      { sura: 2, from: 192, to: 192 },
      { sura: 3, from: 1, to: 1 },
    ]);
  });
});

describe("checkSideInput", () => {
  it("reads form values", () => {
    expect(checkSideInput({ slug: "sufis", title: "Суфии", position: "6" })).toEqual({
      input: { slug: "sufis", title: "Суфии", position: 6 },
      problems: [],
    });
  });

  it("rejects a bad slug and an empty title", () => {
    const { problems } = checkSideInput({ slug: "Суфии", title: "", position: "1" });
    expect(problems.map((p) => p.code).sort()).toEqual(["slug", "title"]);
  });
});
