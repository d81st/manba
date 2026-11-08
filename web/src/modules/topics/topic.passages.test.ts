import { describe, expect, it } from "vitest";
import { passagesOf } from "./topic.passages";

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
