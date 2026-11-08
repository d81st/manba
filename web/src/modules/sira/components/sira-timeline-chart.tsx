import { getMessages } from "@/shared/i18n";
import { approxCommonEra, formatReading, monthsFromHijra } from "../sira.dates";
import type { SiraEvent } from "../sira.types";
import { SOURCE_WORKS, SourceDot, sortDates, sourceColor, sourceLabel, workOf } from "./sira-sources";

const t = getMessages().sira;

// The timeline chart: each event on the months since the hijra, one row per
// event, a mark per source that dates it.
export function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {SOURCE_WORKS.map((work) => (
        <li key={work} className="flex items-center gap-1.5">
          <SourceDot address={work} />
          {t.bookTitles[work]}
        </li>
      ))}
    </ul>
  );
}

const WIDTH = 1000;
const LABEL = 300;
const RIGHT = 985;
const ROW = 26;
const TOP = 44;
const MONTHS = 11 * 12;

export function Chart({ events, suffix }: { events: SiraEvent[]; suffix: string }) {
  const x = (months: number) => LABEL + ((RIGHT - LABEL) * months) / MONTHS;
  const height = TOP + events.length * ROW + 12;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="block min-w-[720px] text-foreground" role="img" aria-label={t.timelinePage.medina}>
      {Array.from({ length: 11 }, (_, i) => i + 1).map((year) => (
        <g key={year}>
          <line x1={x((year - 1) * 12)} x2={x((year - 1) * 12)} y1={TOP - 8} y2={height - 6} className="stroke-border" />
          <text x={x((year - 1) * 12 + 6)} y={16} textAnchor="middle" className="fill-foreground text-[12px]">
            {year} {t.timelinePage.year}
          </text>
          <text x={x((year - 1) * 12 + 6)} y={31} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            {approxCommonEra({ year, month: null, day: null })}
          </text>
        </g>
      ))}
      {events.map((event, row) => {
        const y = TOP + row * ROW + ROW / 2;
        return (
          <g key={event.id}>
            {row % 2 === 1 && <rect x={0} y={y - ROW / 2} width={WIDTH} height={ROW} className="fill-muted opacity-50" />}
            <a href={`/sira/events/${event.slug}${suffix}`}>
              <text x={LABEL - 10} y={y + 4} textAnchor="end" className="fill-primary text-[12px]">
                {event.title.length > 46 ? `${event.title.slice(0, 45)}…` : event.title}
              </text>
            </a>
            {sortDates(event.dates).map((d, i) => {
              const months = monthsFromHijra(d);
              if (months === null) return null;
              const color = sourceColor(d.address);
              const shift = (SOURCE_WORKS.indexOf(workOf(d.address) as (typeof SOURCE_WORKS)[number]) - 1.5) * 2.5;
              return (
                <a key={i} href={`/sira/events/${event.slug}${suffix}`}>
                  <circle
                    cx={x(months)}
                    cy={y + shift}
                    r={5}
                    strokeWidth={2}
                    strokeDasharray={d.variant ? "2 2" : undefined}
                    className={`${color.stroke} ${d.month ? color.fill : "fill-card"}`}
                  >
                    <title>{`${sourceLabel(d.address)}: ${formatReading(d)}${d.holder ? ` — ${d.holder}` : ""}`}</title>
                  </circle>
                </a>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
