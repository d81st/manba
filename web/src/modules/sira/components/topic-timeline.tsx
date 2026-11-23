import Link from "next/link";
import { getMessages, plural } from "@/shared/i18n";
import { Reveal } from "@/shared/ui/reveal";
import { approxCommonEra, formatReading, monthsFromHijra } from "../sira.dates";
import type { SiraEvent } from "../sira.types";
import { SOURCE_WORKS, sortDates, SourceDot, sourceColor, sourceLabel, SourceLink, workOf } from "./sira-sources";

const t = getMessages().sira;

const WIDTH = 720;
const LABEL = 190;
const RIGHT = 705;
const ROW = 28;
const TOP = 40;

// The events a topic is about, on the years of the hijra around them: a dot
// per source that dates the event, as on the whole timeline; below, each
// source's reading with its page. Events dated only before the hijra are
// listed without the scale.
export function TopicTimeline({ events, suffix }: { events: SiraEvent[]; suffix: string }) {
  const months = events.flatMap((e) => e.dates.map((d) => monthsFromHijra(d)).filter((m): m is number => m !== null));
  const from = months.length ? Math.max(0, Math.floor(Math.min(...months) / 12) - 1) : 0;
  const to = months.length ? Math.min(11, Math.floor(Math.max(...months) / 12) + 2) : 0;
  const dated = events.filter((e) => e.dates.some((d) => monthsFromHijra(d) !== null));
  const x = (m: number) => LABEL + ((RIGHT - LABEL) * (m - from * 12)) / ((to - from) * 12);
  const height = TOP + dated.length * ROW + 10;

  return (
    <Reveal id="timeline" title={t.topicTimeline.title} count={plural(events.length, t.mapPage.events)}>
      <p className="mb-3 text-sm text-muted-foreground">{t.topicTimeline.hint}</p>
      {dated.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card p-2">
          <svg viewBox={`0 0 ${WIDTH} ${height}`} className="block min-w-[560px] text-foreground" role="img" aria-label={t.topicTimeline.title}>
            {Array.from({ length: to - from }, (_, i) => from + i + 1).map((year) => (
              <g key={year}>
                <line x1={x((year - 1) * 12)} x2={x((year - 1) * 12)} y1={TOP - 8} y2={height - 4} className="stroke-border" />
                <text x={x((year - 1) * 12 + 6)} y={14} textAnchor="middle" className="fill-foreground text-[12px]">
                  {year} {t.timelinePage.year}
                </text>
                <text x={x((year - 1) * 12 + 6)} y={28} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {approxCommonEra({ year, month: null, day: null })}
                </text>
              </g>
            ))}
            {dated.map((event, row) => {
              const y = TOP + row * ROW + ROW / 2;
              return (
                <g key={event.id}>
                  <a href={`/sira/events/${event.slug}${suffix}`}>
                    <text x={LABEL - 10} y={y + 4} textAnchor="end" className="fill-primary text-[13px]">
                      {event.title.length > 26 ? `${event.title.slice(0, 25)}…` : event.title}
                    </text>
                  </a>
                  {sortDates(event.dates).map((d, i) => {
                    const m = monthsFromHijra(d);
                    if (m === null) return null;
                    const color = sourceColor(d.address);
                    const shift = (SOURCE_WORKS.indexOf(workOf(d.address) as (typeof SOURCE_WORKS)[number]) - 1.5) * 2.5;
                    return (
                      <a key={i} href={`/sira/events/${event.slug}${suffix}`}>
                        <circle
                          cx={x(m)}
                          cy={y + shift}
                          r={6}
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
        </div>
      )}
      <ul className="mt-3 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="text-sm">
            <Link href={`/sira/events/${event.slug}${suffix}`} className="font-medium">
              {event.title}
            </Link>
            <ul className="mt-1 space-y-1">
              {sortDates(event.dates).map((d, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-2">
                  <SourceDot address={d.address} />
                  <span>{sourceLabel(d.address)}:</span>
                  <span>{formatReading(d) || t.noDate}</span>
                  {d.variant && <span className="text-muted-foreground">({t.variant})</span>}
                  <SourceLink address={d.address} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm">
        <Link href={`/sira/timeline${suffix}`}>{t.topicTimeline.open} →</Link>
      </p>
    </Reveal>
  );
}
