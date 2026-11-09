// The events of the ribbon of time (history.ribbon.ts) from «Историческая
// линия» and from the Prophet's life, with every dated reading of the sources.
// Pure functions, used on the server.
import { approxCommonEra, formatReading, HIJRI_MONTHS, type SiraEvent } from "@/modules/sira";
import { bookPath, formatBookRef } from "@/shared/addresses/book-query";
import { getMessages } from "@/shared/i18n";
import { ceLabel } from "./history.calendar";
import { ceToTime, hijriTime, RIBBON_LANES, type RibbonEvent, type RibbonLane, type RibbonReading } from "./history.ribbon";
import type { HistoryDate, HistoryEvent } from "./history.types";

const t = getMessages().history;

// "17 рамадан 35 г. х. (≈ 655/56)"
export function historyDateLabel(d: HistoryDate) {
  const parts: string[] = [];
  if (d.day) parts.push(String(d.day));
  if (d.month) parts.push(HIJRI_MONTHS[d.month - 1]);
  if (d.yearAh !== null) parts.push(`${d.yearAh < 0 ? `${-d.yearAh} до хиджры` : `${d.yearAh} ${t.ah}`} (≈ ${ceLabel(d.yearAh)})`);
  else if (d.yearCe !== null) parts.push(String(d.yearCe));
  return parts.join(" ");
}

function source(address: string) {
  const [work, ...path] = address.split(".");
  return { ref: formatBookRef(address), href: bookPath(work, path.map(Number)) };
}

// The main reading first (the first that is not "another report"), then the span.
function place(readings: RibbonReading[]): Pick<RibbonEvent, "at" | "span"> | null {
  if (readings.length === 0) return null;
  const main = readings.find((r) => !r.variant) ?? readings[0];
  const all = readings.map((r) => r.at);
  return { at: main.at, span: [Math.min(...all), Math.max(...all)] };
}

export function ribbonFromHistory(events: HistoryEvent[]): RibbonEvent[] {
  return events.flatMap((e) => {
    const readings = e.dates.flatMap((d) => {
      const at = d.yearAh !== null ? hijriTime(d.yearAh, d.month, d.day) : d.yearCe !== null ? ceToTime(d.yearCe) : null;
      return at === null ? [] : [{ at, date: historyDateLabel(d), holder: d.holder, variant: d.variant, ...source(d.address) }];
    });
    const placed = place(readings);
    if (!placed || !(RIBBON_LANES as readonly string[]).includes(e.layer)) return [];
    return [{ id: `history:${e.slug}`, lane: e.layer as RibbonLane, title: e.title, href: `#${e.slug}`, draft: e.status !== "published", ...placed, readings }];
  });
}

// Events of the Prophet's life with a year in the sources (an age alone is
// not placed: turning it into a year would be a calculation of ours).
export function ribbonFromSira(events: SiraEvent[], preview: boolean): RibbonEvent[] {
  return events.flatMap((e) => {
    const readings = e.dates.flatMap((d) => {
      if (d.year === null) return [];
      const era = approxCommonEra(d);
      return [{ at: hijriTime(d.year, d.month, d.day), date: [formatReading(d), era && `(${era})`].filter(Boolean).join(" "), holder: d.holder, variant: d.variant, ...source(d.address) }];
    });
    const placed = place(readings);
    if (!placed) return [];
    const href = `/sira/events/${e.slug}${preview ? "?drafts=1" : ""}`;
    return [{ id: `sira:${e.slug}`, lane: "sira" as const, title: e.title, href, draft: e.status !== "published", ...placed, readings }];
  });
}
