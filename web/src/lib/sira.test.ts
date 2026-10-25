import { describe, expect, it } from "vitest";
import { SIRA_PERIODS, periodOf } from "./sira.ts";

describe("periods of the Sira", () => {
  it("cover all 264 sections of the book, in order, without gaps", () => {
    expect(SIRA_PERIODS[0].from).toBe(1);
    expect(SIRA_PERIODS.at(-1)!.to).toBe(264);
    SIRA_PERIODS.slice(1).forEach((p, i) =>
      expect(p.from).toBe(SIRA_PERIODS[i].to + 1),
    );
    expect(periodOf(48)).toBe(1);
    expect(periodOf(114)).toBe(2);
    expect(periodOf(265)).toBe(-1);
  });
});
