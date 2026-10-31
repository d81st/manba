import { describe, expect, it } from "vitest";
import { ceLabel, ceYears, checkHistoryEventInput, placeYear } from "./history-input";

// Sample events are made up for the test (not source data).
const event = {
  slug: "test-event",
  layer: "rulers",
  status: "draft",
  title: "Тестовое событие",
  dates: [{ ref: "Халифа 1:121", quote: "نص تجريبي", yearAh: 13 }],
};

describe("checkHistoryEventInput", () => {
  it("reads a book reference into an address", () => {
    const { input, problems } = checkHistoryEventInput(event);
    expect(problems).toEqual([]);
    expect(input?.dates[0]).toMatchObject({ address: "tarikh_khalifa.1.121", yearAh: 13, yearCe: null, variant: false });
  });

  it("refuses an unknown reference, both years at once and a day without a month", () => {
    const { problems } = checkHistoryEventInput({
      ...event,
      dates: [{ ref: "Неизвестно 1:2", quote: "x", yearAh: 13, yearCe: 634, day: 3 }],
    });
    expect(problems.map((p) => p.code).sort()).toEqual(["dayWithoutMonth", "oneYear", "ref"]);
  });

  it("does not publish an event without a dated reading", () => {
    const { problems } = checkHistoryEventInput({ ...event, status: "published", dates: [{ ref: "Халифа 1:121", quote: "x" }] });
    expect(problems).toEqual([{ field: "dates", code: "datesRequired" }]);
  });

  it("refuses year 0 and an unknown layer", () => {
    expect(checkHistoryEventInput({ ...event, dates: [{ ref: "Халифа 1:1", quote: "x", yearAh: 0 }] }).problems[0].code).toBe("year");
    expect(checkHistoryEventInput({ ...event, layer: "other" }).problems[0].field).toBe("layer");
  });
});

describe("common-era years of a hijra year", () => {
  it("gives the years a hijra year falls in", () => {
    expect(ceYears(1)).toEqual([622, 623]);
    expect(ceYears(13)).toEqual([634, 635]);
    expect(ceYears(132)).toEqual([749, 750]);
    expect(ceYears(1342)).toEqual([1923, 1924]);
    expect(ceYears(-1)).toEqual([621, 622]);
    expect(ceLabel(13)).toBe("634/35");
  });

  it("places an event by its first reading that is not a variant", () => {
    expect(placeYear([{ yearAh: null, yearCe: null, variant: false }, { yearAh: 40, yearCe: null, variant: true }, { yearAh: 41, yearCe: null, variant: false }])).toBe(661);
    expect(placeYear([{ yearAh: null, yearCe: 1924, variant: false }])).toBe(1924);
    expect(placeYear([])).toBeNull();
  });
});
