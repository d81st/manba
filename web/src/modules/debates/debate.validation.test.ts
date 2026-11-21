import { describe, expect, it } from "vitest";
import { checkMove, checkProposal, checkQuestion, positiveId } from "./debate.validation";

describe("debate proposals", () => {
  it("keeps a short question, a language and one partner", () => {
    const { proposal } = checkProposal({
      question: "  Что сказано в аяте престола?  ",
      language: "ru",
      partner: "reader.one",
      topic: "namaz",
    });
    expect(proposal).toEqual({
      question: "Что сказано в аяте престола?",
      language: "ru",
      partner: "reader.one",
      topic: "namaz",
    });
  });

  it("rejects a question that is too short, a bad language and a bad topic", () => {
    expect(checkQuestion("коротко").problem).toBe("tooShort");
    expect(checkProposal({ question: "Достаточно длинный вопрос", language: "uz", partner: "a", topic: "" }).problem).toBe(
      "language",
    );
    expect(
      checkProposal({ question: "Достаточно длинный вопрос", language: "en", partner: "a", topic: "Не слаг" }).problem,
    ).toBe("topic");
  });
});

describe("debate moves", () => {
  it("turns one citation into a library address", () => {
    expect(checkMove({ kind: "answer", body: "Смотрите этот аят.", address: "2:255", parent: "4" }).move).toEqual({
      kind: "answer",
      body: "Смотрите этот аят.",
      address: "quran.2.255",
      parentId: 4,
    });
  });

  it("refuses an answer without exactly one address", () => {
    expect(checkMove({ kind: "answer", body: "Без ссылки.", address: "", parent: "4" }).problem).toBe("address");
    expect(checkMove({ kind: "answer", body: "Две ссылки.", address: "2:255, 2:256", parent: "4" }).problem).toBe("address");
  });

  it("lets a question stand at the root, and a counter-question only under a move", () => {
    expect(checkMove({ kind: "question", body: "Откуда это?", address: "", parent: "" }).move?.parentId).toBeNull();
    expect(checkMove({ kind: "question", body: "Откуда это?", address: "", parent: "4" }).problem).toBe("parent");
    expect(checkMove({ kind: "counter", body: "А это откуда?", address: "2:256", parent: "" }).problem).toBe("parent");
  });

  it("reads only a safe numeric id", () => {
    expect(positiveId("12")).toBe(12);
    expect(positiveId("0")).toBeNull();
    expect(positiveId("1e2")).toBeNull();
    expect(positiveId("999999999999")).toBeNull();
  });
});
