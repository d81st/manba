import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { approxCommonEra, formatReading } from "@/lib/sira-dates";
import { getSiraData } from "@/lib/sira-events";
import { isPreview, PreviewNote, SiraNav, SourceDot, SourceLink, sortDates, sourceLabel } from "../../shared";

const messages = getMessages();
const t = messages.sira;

export const metadata: Metadata = { title: t.title };

// One event: what each source says of its date, in its own words.
export default function EventPage({ params, searchParams }: PageProps<"/sira/events/[slug]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Event params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Event({ params, searchParams }: Pick<PageProps<"/sira/events/[slug]">, "params" | "searchParams">) {
  await connection();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const preview = isPreview(query);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const data = await getSiraData(preview);
  const event = data.events.find((e) => e.slug === slug);
  if (!event) notFound();
  const place = data.places.find((p) => p.slug === event.place);
  const suffix = preview ? "?drafts=1" : "";

  return (
    <>
      <SiraNav path={`/sira/events/${slug}`} preview={preview} />
      <PreviewNote preview={preview} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{t.kinds[event.kind as keyof typeof t.kinds] ?? event.kind}</Badge>
        {event.status !== "published" && <Badge variant="outline">{t.draft}</Badge>}
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{event.title}</h1>
      <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-muted-foreground">{t.event.place}</dt>
        <dd>
          {place ? (
            <Link href={`/sira/map${suffix}#${place.slug}`}>
              {place.name} <span className="ar" lang="ar" dir="rtl">{place.nameAr}</span>
            </Link>
          ) : (
            <span className="text-muted-foreground">{t.event.noPlace}</span>
          )}
        </dd>
        {event.topic && (event.topic.published || preview) && (
          <>
            <dt className="text-muted-foreground">{t.event.card}</dt>
            <dd>
              <Link href={`/topics/${event.topic.slug}`}>{event.topic.slug}</Link>
            </dd>
          </>
        )}
      </dl>

      <h2 className="mt-8 mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.event.dates}</h2>
      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">{t.event.datesHint}</p>
      <ul className="space-y-3">
        {sortDates(event.dates).map((d, i) => {
          const reading = formatReading(d);
          const era = approxCommonEra(d);
          return (
            <li key={i} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <SourceDot address={d.address} />
                <span className="font-medium">{sourceLabel(d.address)}</span>
                <SourceLink address={d.address} />
                {d.holder && <span className="text-muted-foreground">· {d.holder}</span>}
                {d.variant && <Badge variant="outline">{t.variant}</Badge>}
              </div>
              <p className="ar mt-2 text-xl leading-loose" lang="ar" dir="rtl">
                {d.quote}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-medium">{reading || t.noDate}</span>
                {era && (
                  <span className="text-muted-foreground" title={t.approx}>
                    {" "}
                    ({era})
                  </span>
                )}
              </p>
              {d.note && <p className="mt-1 text-sm text-muted-foreground">{d.note}</p>}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">≈ — {t.approx}.</p>
    </>
  );
}
