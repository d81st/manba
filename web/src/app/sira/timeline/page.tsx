import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { approxCommonEra, formatReading, monthsFromHijra } from "@/lib/sira-dates";
import { getSiraData, type SiraEvent } from "@/lib/sira-events";
import { isPreview, PreviewNote, SiraNav, SOURCE_WORKS, SourceDot, sortDates, sourceColor, sourceLabel, workOf } from "../shared";

const messages = getMessages();
const t = messages.sira;

export const metadata: Metadata = { title: t.timelinePage.title };

export default function TimelinePage({ searchParams }: PageProps<"/sira/timeline">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Timeline searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

const hasHijraDate = (e: SiraEvent) => e.dates.some((d) => monthsFromHijra(d) !== null);

async function Timeline({ searchParams }: Pick<PageProps<"/sira/timeline">, "searchParams">) {
  await connection();
  const preview = isPreview(await searchParams);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const { events } = await getSiraData(preview);
  const suffix = preview ? "?drafts=1" : "";
  const mecca = events.filter((e) => !hasHijraDate(e));
  const medina = events.filter(hasHijraDate);

  return (
    <>
      <SiraNav path="/sira/timeline" preview={preview} />
      <PreviewNote preview={preview} />
      <h1 className="mt-4 text-2xl font-semibold">{t.timelinePage.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.timelinePage.intro}</p>
      <Legend />
      {events.length === 0 && <p className="mt-6 text-muted-foreground">{t.empty}</p>}

      {mecca.length > 0 && (
        <section>
          <h2 className="mt-8 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.timelinePage.mecca}</h2>
          <ol className="space-y-2 border-s-2 ps-4">
            {mecca.map((event) => (
              <li key={event.id}>
                <Link href={`/sira/events/${event.slug}${suffix}`} className="font-medium">
                  {event.title}
                </Link>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {sortDates(event.dates).map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <SourceDot address={d.address} />
                      <span className="text-muted-foreground">{sourceLabel(d.address)}:</span>
                      <span className={d.variant ? "italic" : ""}>{formatReading(d) || d.note || t.noDate}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      {medina.length > 0 && (
        <section>
          <h2 className="mt-8 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.timelinePage.medina}</h2>
          <p className="mb-2 text-xs text-muted-foreground">{t.timelinePage.hollow}</p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Chart events={medina} suffix={suffix} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">≈ — {t.approx}.</p>
        </section>
      )}
    </>
  );
}

function Legend() {
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

function Chart({ events, suffix }: { events: SiraEvent[]; suffix: string }) {
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
