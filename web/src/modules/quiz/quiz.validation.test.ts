import { describe, expect, it } from "vitest";
import { levelKey, questionLevel } from "./quiz.levels";
import { checkQuestionInput } from "./quiz.validation";

// A made-up question for the test (not a real test question).
const question = {
  status: "draft",
  prompt: "Тестовый вопрос?",
  options: [
    { text: "Ответ А", correct: true },
    { text: "Ответ Б", correct: false },
  ],
  refs: "2:255, Бухари 1",
};

describe("checkQuestionInput", () => {
  it("reads the fragments into addresses", () => {
    const { input, problems } = checkQuestionInput(question);
    expect(problems).toEqual([]);
    expect(input?.addresses).toEqual(["quran.2.255", "bukhari.1"]);
  });

  it("does not publish without two answers, a right one and fragments", () => {
    const codes = (raw: object) => checkQuestionInput({ ...question, status: "published", ...raw }).problems.map((p) => p.code);
    expect(codes({ options: [{ text: "Один", correct: true }] })).toEqual(["optionsRequired"]);
    expect(codes({ options: [{ text: "А" }, { text: "Б" }] })).toEqual(["correctRequired"]);
    expect(codes({ refs: "" })).toEqual(["refsRequired"]);
    expect(codes({})).toEqual([]);
  });

  it("refuses unknown references and repeated answers", () => {
    const { problems } = checkQuestionInput({ ...question, refs: "что-то", options: [{ text: "А" }, { text: "а" }] });
    expect(problems.map((p) => p.code).sort()).toEqual(["optionRepeated", "refs"]);
  });
});

describe("questionLevel", () => {
  it("takes the highest authority in each canon", () => {
    const level = questionLevel([
      { sunni: 2, shia: null },
      { sunni: 1, shia: 1 },
      { sunni: null, shia: null },
    ]);
    expect(level).toEqual({ sunni: 1, shia: 1 });
    expect(levelKey({ sunni: null, shia: 2 })).toBe(2);
    expect(levelKey(questionLevel([{ sunni: null, shia: null }]))).toBeNull();
  });
});
