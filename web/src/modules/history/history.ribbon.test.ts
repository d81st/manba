import { describe, expect, it } from "vitest";
import { ceTicks, ceToTime, hijriTicks, hijriTime, placeTitles, tickStep, timeToCe, timeToYear } from "./history.ribbon";
import { ribbonFromHistory, ribbonFromSira } from "./history.ribbon-data";
import type { HistoryEvent } from "./history.types";
import type { SiraEvent } from "@/modules/sira";

describe("the scale of years", () => {
  it("counts from 1 Muharram 1, with no year 0", () => {
    expect(hijriTime(1)).toBe(0.5);
    expect(hijriTime(1, 1)).toBeCloseTo(1 / 24);
    expect(hijriTime(35, 12, 18)).toBeCloseTo(34 + (11 + 17.5 / 30) / 12);
    expect(hijriTime(-1)).toBe(-0.5);
    expect(timeToYear(0.2)).toBe(1);
    expect(timeToYear(-0.2)).toBe(-1);
  });

  it("turns common-era years into the scale and back", () => {
    expect(timeToCe(0)).toBeCloseTo(622.54, 1);
    expect(timeToCe(ceToTime(750))).toBeCloseTo(750.5);
  });

  it("chooses round ticks for the years in view", () => {
    expect(tickStep(400, 8)).toBe(50);
    expect(hijriTicks(-10, 30, 4).map((t) => t.label)).toEqual(["−10", "1", "10", "20", "30"]);
    expect(ceTicks(ceToTime(700), ceToTime(800), 5).map((t) => t.label)).toEqual(["720", "740", "760", "780", "800"]);
  });

  it("places titles without collisions, the chosen one first, left of the dot at the end", () => {
    const dots = [
      { id: "a", lane: "x", x: 0, width: 80 },
      { id: "b", lane: "x", x: 50, width: 80 },
      { id: "c", lane: "y", x: 50, width: 80 },
      { id: "d", lane: "x", x: 150, width: 80 },
      { id: "e", lane: "y", x: 290, width: 80 },
    ];
    expect([...placeTitles(dots, 300)]).toEqual([["a", "right"], ["c", "right"], ["d", "right"], ["e", "left"]]);
    expect([...placeTitles(dots, 300, new Set(["b"]))].map(([id]) => id)).toEqual(["b", "c", "d", "e"]);
  });
});

// Fictional events and readings: only the placing is tested.
describe("events on the ribbon", () => {
  const date = { address: "tarikh_tabari.1.2", quote: "…", holder: "Источник А", month: null, day: null, note: "" };
  it("places an event at its main reading and spans the other readings", () => {
    const events: HistoryEvent[] = [
      {
        id: 1,
        slug: "test-event",
        layer: "rulers",
        title: "Вымышленное событие",
        status: "published",
        topic: null,
        dates: [
          { ...date, yearAh: 36, yearCe: null, variant: true },
          { ...date, yearAh: 35, yearCe: null, variant: false },
        ],
      },
      { id: 2, slug: "no-date", layer: "rulers", title: "Без даты", status: "draft", topic: null, dates: [] },
    ];
    const [e, ...rest] = ribbonFromHistory(events);
    expect(rest).toEqual([]);
    expect(e).toMatchObject({ id: "history:test-event", lane: "rulers", href: "#test-event", draft: false, at: 34.5, span: [34.5, 35.5] });
    expect(e.readings[1].date).toMatch(/^35 г\. х\. \(≈ 65/);
    expect(e.readings[0].href).toBe("/library/tarikh_tabari/1.2");
  });

  it("leaves out readings of the Prophet's life that give only an age", () => {
    const sira = [
      {
        id: 1,
        slug: "test-sira",
        kind: "event",
        title: "Вымышленное событие жизнеописания",
        status: "draft",
        position: 0,
        place: null,
        topic: null,
        dates: [
          { address: "ibn_hisham.1", quote: "…", holder: "", year: null, month: null, day: null, age: 40, variant: false, note: "" },
          { address: "ibn_hisham.2", quote: "…", holder: "", year: -13, month: null, day: null, age: null, variant: false, note: "" },
        ],
      },
    ] as SiraEvent[];
    const [e] = ribbonFromSira(sira, true);
    expect(e).toMatchObject({ lane: "sira", href: "/sira/events/test-sira?drafts=1", draft: true, at: -12.5 });
    expect(e.readings).toHaveLength(1);
  });
});
