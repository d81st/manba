import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { bookPath, formatBookRef } from "@/lib/book-query";
import { cn } from "@/lib/utils";
import { ceLabel } from "../history.calendar";
import { groupByPeriod, SCALES, type Scale } from "../history.periods";
import type { HistoryDate, HistoryEvent } from "../history.types";
import { HISTORY_LAYERS, type HistoryLayer } from "../history.validation";
import { HIJRI_MONTHS } from "@/modules/sira";

const messages = getMessages();
const t = messages.history;

// The timeline: layer and scale filters, events grouped by period, each with
// every dated reading of the sources. Data and the filter addresses come from the page.
export function HistoryTimeline({
  events,
  layer,
  scale,
  preview,
  query,
}: {
  events: HistoryEvent[];
  layer: HistoryLayer | null;
  scale: Scale;
  preview: boolean;
  query: (patch: Record<string, string | null>) => string;
}) {
  const { groups, undated } = groupByPeriod(events, scale);
  return (
    <>
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
