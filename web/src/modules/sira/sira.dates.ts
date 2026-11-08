// Dates of the Prophet's life as the sources give them (docs/PLAN.md,
// «Жизнеописание пророка»): the reading of a source's words, and an
// approximate year of the common era. No database here.
//
// year — the hijri year, negative for the years before the hijra (-3 — the
// third year before it; there is no year 0). The common-era year is a
// calculation by the tabular hijri calendar, with dates before 1582 in the
// Julian calendar: for the early years researchers count differently, so the
// site always shows it as approximate.

export type DateReading = {
  year: number | null;
  month: number | null;
  day: number | null;
  age: number | null;
};

export const HIJRI_MONTHS = [
  "мухаррам",
  "сафар",
  "раби аль-авваль",
  "раби ас-сани",
  "джумада аль-уля",
  "джумада ас-сани",
  "раджаб",
  "шаабан",
  "рамадан",
  "шавваль",
  "зу-ль-када",
  "зу-ль-хиджа",
] as const;

// "17 рамадана"
const MONTHS_GENITIVE = [
  "мухаррама",
  "сафара",
  "раби аль-авваля",
  "раби ас-сани",
  "джумады аль-уля",
  "джумады ас-сани",
  "раджаба",
  "шаабана",
  "рамадана",
  "шавваля",
  "зу-ль-кады",
  "зу-ль-хиджи",
] as const;

function years(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "года";
  return "лет";
}

// "17 рамадана 2 г. х.", "сафар 2 г. х.", "за 3 года до хиджры", "в возрасте 40 лет"
export function formatReading(d: DateReading) {
  const parts: string[] = [];
  if (d.month) parts.push(d.day ? `${d.day} ${MONTHS_GENITIVE[d.month - 1]}` : HIJRI_MONTHS[d.month - 1]);
  if (d.year !== null) parts.push(d.year > 0 ? `${d.year} г. х.` : `за ${-d.year} ${years(-d.year)} до хиджры`);
  const date = parts.join(" ");
  // "в возрасте 21 года", "в возрасте 53 лет"
  const age = d.age !== null ? `в возрасте ${d.age} ${d.age % 10 === 1 && d.age % 100 !== 11 ? "года" : "лет"}` : "";
  return [date, age].filter(Boolean).join(", ");
}

// Julian day of the first of Muharram, year 1 (16 July 622, Julian).
const EPOCH = 1948439.5;
const LUNAR_YEAR = 354.367;

function julianDay(year: number, month: number, day: number) {
  if (year < 0) return EPOCH + year * LUNAR_YEAR + (month - 1) * 29.53 + (day - 1);
  return EPOCH + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + 29 * (month - 1) + Math.floor(month / 2) + day - 1;
}

// Julian-calendar year of a Julian day.
function julianYear(jd: number) {
  const c = Math.floor(jd + 0.5) + 32082;
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return d - 4800 + Math.floor(m / 10);
}

// "≈ 624", "≈ 619/620" (a hijri year without a month falls on two years), or null.
export function approxCommonEra(d: Pick<DateReading, "year" | "month" | "day">) {
  if (d.year === null) return null;
  if (d.month) {
    const from = julianYear(julianDay(d.year, d.month, d.day ?? 1));
    const to = julianYear(julianDay(d.year, d.month, d.day ?? 29));
    return from === to ? `≈ ${from}` : `≈ ${from}/${to}`;
  }
  const from = julianYear(julianDay(d.year, 1, 1));
  const to = julianYear(julianDay(d.year, 12, 29));
  return from === to ? `≈ ${from}` : `≈ ${from}/${to}`;
}

// Months from the start of the year 1 of the hijra, for the timeline: the
// middle of the month or of the year when the source is less precise.
export function monthsFromHijra(d: Pick<DateReading, "year" | "month" | "day">) {
  if (d.year === null || d.year < 1) return null;
  if (!d.month) return (d.year - 1) * 12 + 6;
  return (d.year - 1) * 12 + (d.month - 1) + (d.day ? (d.day - 0.5) / 30 : 0.5);
}
