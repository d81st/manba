// The ribbon of time above the list: events of «Историческая линия» and of the
// Prophet's life on one scale of years, each lane a layer. Time is counted in
// hijri years from the start of year 1 (0 = 1 Muharram 1, 16 July 622; -1 —
// the start of the year before the hijra; there is no year 0). Pure functions,
// safe for the browser; the events are built in history.ribbon-data.ts.

export const RIBBON_LANES = ["sira", "rulers", "texts", "doctrine", "science"] as const;
export type RibbonLane = (typeof RIBBON_LANES)[number];

// One dated reading of a source: where it puts the event and in whose words.
export type RibbonReading = { at: number; date: string; holder: string; variant: boolean; ref: string; href: string };

export type RibbonEvent = {
  id: string;
  lane: RibbonLane;
  title: string;
  href: string; // the full entry: its card in the list below or its page
  draft: boolean;
  at: number; // where the dot stands: the main reading
  span: [number, number]; // from the earliest to the latest reading
  readings: RibbonReading[];
};

// Lunar years in solar ones, and 1 Muharram 1 as a fraction of 622.
const YEAR = 354.367 / 365.2425;
const START = 622 + 196.5 / 365.2425;

// A hijri date on the scale: the middle of the day, month or year the source names.
export function hijriTime(year: number, month: number | null = null, day: number | null = null): number {
  const base = year > 0 ? year - 1 : year;
  const part = month ? (month - 1 + (day ? (day - 0.5) / 30 : 0.5)) / 12 : 0.5;
  return base + part;
}

// A common-era year on the scale (its middle) and back.
export const ceToTime = (ce: number) => (ce + 0.5 - START) / YEAR;
export const timeToCe = (time: number) => START + time * YEAR;

// The hijri year a point of the scale falls in.
export const timeToYear = (time: number) => (time >= 0 ? Math.floor(time) + 1 : Math.floor(time));

// Round steps for the ticks: about `count` of them across the visible years.
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500];
export function tickStep(span: number, count: number) {
  return STEPS.find((s) => span / s <= count) ?? STEPS[STEPS.length - 1];
}

// Hijri ticks: the starts of round years (labels "50", "−10"). There is no
// year 0: in its place stands year 1, the hijra itself.
export function hijriTicks(from: number, to: number, count: number): { at: number; label: string }[] {
  const step = tickStep(to - from, count);
  const out: { at: number; label: string }[] = [];
  for (let y = Math.floor(timeToYear(from) / step) * step; y <= timeToYear(to) + step; y += step) {
    const year = y === 0 ? 1 : y;
    const at = year > 0 ? year - 1 : year;
    if (at >= from && at <= to) out.push({ at, label: year < 0 ? `−${-year}` : String(year) });
  }
  return out;
}

// Common-era ticks: round years.
export function ceTicks(from: number, to: number, count: number): { at: number; label: string }[] {
  const [a, b] = [timeToCe(from), timeToCe(to)];
  const step = tickStep(b - a, count);
  const out: { at: number; label: string }[] = [];
  for (let ce = Math.ceil(a / step) * step; ce <= b; ce += step) out.push({ at: ceToTime(ce) - 0.5, label: String(ce) });
  return out;
}

// Where titles fit beside their dots: the chosen ones first, then left to
// right; a title stands right of its dot, or left of it at the end of the
// ribbon, and is left out when it would run into another in its lane.
export function placeTitles(
  dots: { id: string; lane: string; x: number; width: number }[],
  limit: number,
  first: Set<string> = new Set(),
  gap = 8,
): Map<string, "right" | "left"> {
  const placed = new Map<string, "right" | "left">();
  const taken = new Map<string, [number, number][]>();
  const order = [...dots].sort((p, q) => Number(first.has(q.id)) - Number(first.has(p.id)) || p.x - q.x);
  for (const d of order) {
    const side = d.x + 9 + d.width <= limit ? "right" : "left";
    const range: [number, number] = side === "right" ? [d.x, d.x + 9 + d.width] : [d.x - 9 - d.width, d.x];
    const lane = taken.get(d.lane) ?? [];
    if (!first.has(d.id) && lane.some(([a, b]) => range[0] < b + gap && range[1] > a - gap)) continue;
    lane.push(range);
    taken.set(d.lane, lane);
    placed.set(d.id, side);
  }
  return placed;
}
