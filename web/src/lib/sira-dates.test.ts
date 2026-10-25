import { describe, expect, it } from "vitest";
import { approxCommonEra, formatReading, monthsFromHijra } from "./sira-dates.ts";

const date = (year: number | null, month: number | null = null, day: number | null = null, age: number | null = null) => ({
  year,
  month,
  day,
  age,
});

describe("formatReading", () => {
  it("writes the reading of a date in Russian", () => {
    expect(formatReading(date(2, 9, 17))).toBe("17 рамадана 2 г. х.");
    expect(formatReading(date(2, 2))).toBe("сафар 2 г. х.");
    expect(formatReading(date(-3))).toBe("за 3 года до хиджры");
    expect(formatReading(date(-13))).toBe("за 13 лет до хиджры");
    expect(formatReading(date(null, null, null, 40))).toBe("в возрасте 40 лет");
    expect(formatReading(date(1, null, null, 53))).toBe("1 г. х., в возрасте 53 лет");
    expect(formatReading(date(null, 3, 12))).toBe("12 раби аль-авваля");
    expect(formatReading(date(null))).toBe("");
  });
});

describe("approxCommonEra", () => {
  it("gives the year of the common era by the tabular calendar", () => {
    // 1 Muharram 1 AH is 16 July 622 (Julian); 17 Ramadan 2 AH falls in March 624.
    expect(approxCommonEra(date(1, 1, 1))).toBe("≈ 622");
    expect(approxCommonEra(date(2, 9, 17))).toBe("≈ 624");
    expect(approxCommonEra(date(11, 3, 12))).toBe("≈ 632");
    expect(approxCommonEra(date(8))).toBe("≈ 629/630");
    expect(approxCommonEra(date(-3))).toBe("≈ 619/620");
    expect(approxCommonEra(date(null, 9))).toBeNull();
  });
});

describe("monthsFromHijra", () => {
  it("places dates of the hijra years on the timeline", () => {
    expect(monthsFromHijra(date(1, 3, 12))).toBeCloseTo(2 + 11.5 / 30);
    expect(monthsFromHijra(date(2, 9))).toBe(20.5);
    expect(monthsFromHijra(date(8))).toBe(90);
    expect(monthsFromHijra(date(-3))).toBeNull();
  });
});
