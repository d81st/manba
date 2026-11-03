import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { bookPath, formatBookRef } from "@/lib/book-query";
import { isDatabaseConfigured } from "@/lib/db";
import { getHistoryEvents, type HistoryDate, type HistoryEvent } from "@/lib/history";
import { ceLabel, HISTORY_LAYERS, type HistoryLayer, placeYear } from "@/lib/history-input";
import { HIJRI_MONTHS } from "@/lib/sira-dates";
import { cn } from "@/lib/utils";
import { isPreview } from "@/lib/preview";
import { PreviewBar } from "../sira/shared";

const messages = getMessages();
const t = messages.history;

export const metadata: Metadata = { title: t.title };

const SCALES = ["century", "decade", "year"] as const;
type Scale = (typeof SCALES)[number];

// «Историческая линия» (docs/PLAN.md, migration 022): events on layers, each
// with every dated reading of the sources; a period is a century, a decade or
// a year of the common era.
export default function HistoryPage({ searchParams }: PageProps<"/history">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Timeline searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

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

async function Timeline({ searchParams }: Pick<PageProps<"/history">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const preview = await isPreview(params);
  const layer = HISTORY_LAYERS.find((l) => l === params.layer) ?? null;
  const scale: Scale = SCALES.find((s) => s === params.scale) ?? "century";
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const events = (await getHistoryEvents(preview)).filter((e) => !layer || e.layer === layer);

  const query = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const all = { layer, scale: scale === "century" ? null : scale, drafts: preview ? "1" : null, ...patch };
    for (const [k, v] of Object.entries(all)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/history?${s}` : "/history";
  };

  const placed = events
    .map((e) => ({ event: e, year: placeYear(e.dates) }))
    .sort((a, b) => (a.year ?? 1e9) - (b.year ?? 1e9) || a.event.id - b.event.id);
  const groups: { key: number; label: string; items: { event: HistoryEvent; year: number }[] }[] = [];
  for (const { event, year } of placed) {
    if (year === null) continue;
    const period = periodOf(year, scale);
    const last = groups.at(-1);
    if (last && last.key === period.key) last.items.push({ event, year });
    else groups.push({ ...period, items: [{ event, year }] });
  }
  const undated = placed.filter((p) => p.year === null).map((p) => p.event);

  return (
    <>
      <PreviewBar href="/history" preview={preview} />
      <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <Chip href={query({ layer: null })} active={!layer}>
          {t.allLayers}
        </Chip>
        {HISTORY_LAYERS.map((l) => (
          <Chip key={l} href={query({ layer: l })} active={layer === l}>
            {t.layers[l]}
          </Chip>
        ))}
      </nav>
      <nav className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t.scale}:</span>
        {SCALES.map((s) => (
          <Chip key={s} href={query({ scale: s === "century" ? null : s })} active={scale === s}>
            {t.scales[s]}
          </Chip>
        ))}
      </nav>

      {events.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t.empty} <Link href="/admin/history">{t.drafts}</Link>
        </p>
      ) : (
        <ol className="mt-6 border-s-2 border-border ps-4 sm:ps-6">
          {groups.map((group) => (
            <li key={group.key} className="relative pb-6">
              <span className="absolute -start-[1.4rem] top-1.5 size-3 rounded-full border-2 border-primary bg-background sm:-start-[1.9rem]" />
              <h2 className="text-lg font-semibold tabular-nums">{group.label}</h2>
              <ul className="mt-2 space-y-3">
                {group.items.map(({ event }) => (
                  <EventCard key={event.id} event={event} preview={preview} />
                ))}
              </ul>
            </li>
          ))}
          {undated.length > 0 && (
            <li className="relative pb-6">
              <h2 className="text-lg font-semibold">{t.undated}</h2>
              <ul className="mt-2 space-y-3">
                {undated.map((event) => (
                  <EventCard key={event.id} event={event} preview={preview} />
                ))}
              </ul>
            </li>
          )}
        </ol>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{t.sources}</p>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-full border px-3 py-1 no-underline",
        active ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}

function EventCard({ event, preview }: { event: HistoryEvent; preview: boolean }) {
  return (
    <li id={event.slug} className="scroll-mt-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm target:border-primary">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{event.title}</span>
        <Badge variant="outline">{t.layers[event.layer as HistoryLayer] ?? event.layer}</Badge>
        {event.status !== "published" && (
          <Badge variant="secondary">{messages.admin.statuses[event.status as keyof typeof messages.admin.statuses] ?? event.status}</Badge>
        )}
        {event.topic && (event.topic.published || preview) && (
          <Link
            href={preview ? `/topics/${event.topic.slug}?drafts=1` : `/topics/${event.topic.slug}`}
            className="ms-auto text-sm"
          >
            {t.topic}: {event.topic.title}
          </Link>
        )}
      </div>
      <ul className="mt-2 space-y-2">
        {event.dates.map((d, i) => (
          <DateLine key={i} date={d} />
        ))}
      </ul>
    </li>
  );
}

function dateLabel(d: HistoryDate) {
  const parts: string[] = [];
  if (d.day) parts.push(String(d.day));
  if (d.month) parts.push(HIJRI_MONTHS[d.month - 1]);
  if (d.yearAh !== null) parts.push(`${d.yearAh < 0 ? `${-d.yearAh} до хиджры` : `${d.yearAh} ${t.ah}`} (≈ ${ceLabel(d.yearAh)})`);
  else if (d.yearCe !== null) parts.push(String(d.yearCe));
  return parts.join(" ");
}

function DateLine({ date }: { date: HistoryDate }) {
  const path = date.address.split(".").slice(1).map(Number);
  const work = date.address.split(".")[0];
  return (
    <li className="text-sm">
      <span className="font-medium tabular-nums">{dateLabel(date) || "—"}</span>
      {date.variant && <span className="text-muted-foreground"> · {t.variant}</span>}
      {date.holder && <span className="text-muted-foreground"> · {date.holder}</span>}
      {" · "}
      <Link href={bookPath(work, path)}>{formatBookRef(date.address)}</Link>
      <p className="ar mt-1 text-base leading-loose" lang="ar" dir="rtl">
        {date.quote}
      </p>
      {date.note && <p className="text-xs text-muted-foreground">{date.note}</p>}
    </li>
  );
}
