import { getMessages } from "@/shared/i18n";
import type { HistoryEvent } from "./history.types";
import { placeYear } from "./history.calendar";

const t = getMessages().history;

// A period of the timeline is a century, a decade or a year of the common era.
export const SCALES = ["century", "decade", "year"] as const;
export type Scale = (typeof SCALES)[number];

const ROMAN: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];
function roman(n: number) {
  let out = "";
  for (const [value, sign] of ROMAN)
    while (n >= value) {
      out += sign;
      n -= value;
    }
  return out;
}

function periodOf(year: number, scale: Scale) {
  if (scale === "century") return { key: Math.floor((year - 1) / 100), label: t.century.replace("{n}", roman(Math.floor((year - 1) / 100) + 1)) };
  if (scale === "decade") return { key: Math.floor(year / 10), label: `${Math.floor(year / 10) * 10}-е` };
  return { key: year, label: String(year) };
}

export type PeriodGroup = { key: number; label: string; items: { event: HistoryEvent; year: number }[] };

// Events in the order of their years, grouped by period; events without a year apart.
export function groupByPeriod(events: HistoryEvent[], scale: Scale): { groups: PeriodGroup[]; undated: HistoryEvent[] } {
  const placed = events
    .map((e) => ({ event: e, year: placeYear(e.dates) }))
    .sort((a, b) => (a.year ?? 1e9) - (b.year ?? 1e9) || a.event.id - b.event.id);
  const groups: PeriodGroup[] = [];
  for (const { event, year } of placed) {
    if (year === null) continue;
    const period = periodOf(year, scale);
    const last = groups.at(-1);
    if (last && last.key === period.key) last.items.push({ event, year });
    else groups.push({ ...period, items: [{ event, year }] });
  }
  return { groups, undated: placed.filter((p) => p.year === null).map((p) => p.event) };
}
