// Hijri years in the common era (approximate: a lunar year is 354.367 days) and
// the year an event is placed at on the timeline.

// The common-era years a hijra year falls in (it is 354 or 355 days long):
// year 1 began on 16 July 622. An approximation for display, marked "≈" on
// the site: [first, last], equal when the year lies within one CE year.
const YEAR = 354.367 / 365.2425;

const START = 622 + 196.5 / 365.2425; // 16 July 622 as a fraction of the year

export function ceYears(yearAh: number): [number, number] {
  const n = yearAh > 0 ? yearAh - 1 : yearAh; // no year 0
  const start = START + n * YEAR;
  return [Math.floor(start), Math.floor(start + YEAR)];
}

export function ceLabel(yearAh: number) {
  const [a, b] = ceYears(yearAh);
  return a === b ? String(a) : `${a}/${String(b).slice(-2)}`;
}

// The year an event is placed at on the line: its first dated reading, in
// common-era years (a hijra year counts by the CE year it begins in).
export function placeYear(dates: { yearAh: number | null; yearCe: number | null; variant: boolean }[]) {
  const main = dates.find((d) => !d.variant && (d.yearAh !== null || d.yearCe !== null)) ??
    dates.find((d) => d.yearAh !== null || d.yearCe !== null);
  if (!main) return null;
  return main.yearCe ?? ceYears(main.yearAh!)[0];
}
