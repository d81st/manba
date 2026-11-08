import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { isDatabaseConfigured } from "@/shared/db";
import { isPreview } from "@/shared/auth/preview";
import { PreviewNote } from "@/shared/layout/preview";
import { formatReading, monthsFromHijra, type SiraEvent, SiraNav, SiraTimelineChart, SiraTimelineLegend, sortDates, SourceDot, sourceLabel } from "@/modules/sira";
import { getSiraData } from "@/modules/sira/server";

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
  const preview = await isPreview(await searchParams);
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
      <SiraTimelineLegend />
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
            <SiraTimelineChart events={medina} suffix={suffix} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">≈ — {t.approx}.</p>
        </section>
      )}
    </>
  );
}
