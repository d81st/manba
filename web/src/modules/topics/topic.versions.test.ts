import { describe, expect, it } from "vitest";
import { checkVersionPointInput } from "./topic.versions";

// Fictional test data: not real quotations or positions.
const cell = (holder: string, quote: string, ref: string) => ({ holder, quote, ref });

describe("checkVersionPointInput", () => {
  it("keeps filled cells with one place each and leaves empty ones out", () => {
    const { input, problems } = checkVersionPointInput({
      label: " Вопрос ",
      position: "2",
      cells: [cell("Школа А", " نص تجريبي ", "Бухари 1"), cell("Школа Б", "", ""), cell("Школа В", "نص", "Ибн Хишам 1:235b")],
    });
    expect(problems).toEqual([]);
    expect(input).toEqual({
      label: "Вопрос",
      position: 2,
      cells: [
        { holder: "Школа А", quote: "نص تجريبي", address: "bukhari.1", row: 0 },
        { holder: "Школа В", quote: "نص", address: "ibn_hisham.1.235.2", row: 2 },
      ],
    });
  });

  it("asks for a label, one place per quotation and a quotation per place", () => {
    expect(checkVersionPointInput({ label: "", position: 0, cells: [] }).problems).toEqual([{ field: "label", code: "label" }]);
    const { problems } = checkVersionPointInput({
      label: "Вопрос",
      position: 0,
      cells: [cell("А", "نص", "Бухари 1, Бухари 2"), cell("Б", "", "Бухари 3"), cell("В", "نص", "не адрес")],
    });
    expect(problems.map((p) => `${p.field}:${p.code}`)).toEqual(["cells.0.ref:refOne", "cells.1.quote:quoteMissing", "cells.2.ref:refOne"]);
  });

  it("does not take one position twice", () => {
    const { problems } = checkVersionPointInput({ label: "Вопрос", position: 0, cells: [cell("А", "", ""), cell("А", "", "")] });
    expect(problems).toEqual([{ field: "cells.1.holder", code: "holderTwice" }]);
  });
});
