import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { isDatabaseConfigured } from "@/shared/db";
import { HISTORY_LAYERS, HistoryRibbon, HistoryTimeline, ribbonFromHistory, ribbonFromSira, SCALES, type Scale } from "@/modules/history";
import { getHistoryEvents } from "@/modules/history/server";
import { getSiraData } from "@/modules/sira/server";
import { isPreview } from "@/shared/auth/preview";
import { PreviewBar } from "@/shared/layout/preview";

const messages = getMessages();
const t = messages.history;

export const metadata: Metadata = { title: t.title };

// «Историческая линия» (docs/PLAN.md, migration 022): events on layers, each
// with every dated reading of the sources, on a ribbon of time and as a list
// (a period is a century, a decade or a year of the common era).
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

async function Timeline({ searchParams }: Pick<PageProps<"/history">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const preview = await isPreview(params);
  const layer = HISTORY_LAYERS.find((l) => l === params.layer) ?? null;
  const scale: Scale = SCALES.find((s) => s === params.scale) ?? "century";
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const [all, sira] = await Promise.all([getHistoryEvents(preview), layer ? null : getSiraData(preview)]);
  const events = all.filter((e) => !layer || e.layer === layer);
  // The ribbon: the same events on a scale of years; with all layers, also
  // the events of the Prophet's life (their own lane).
  const ribbon = [...(sira ? ribbonFromSira(sira.events, preview) : []), ...ribbonFromHistory(events)];

  const query = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const all = { layer, scale: scale === "century" ? null : scale, drafts: preview ? "1" : null, ...patch };
    for (const [k, v] of Object.entries(all)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/history?${s}` : "/history";
  };

  return (
    <>
      <PreviewBar href="/history" preview={preview} />
      <HistoryTimeline
        events={events}
        layer={layer}
        scale={scale}
        preview={preview}
        query={query}
        ribbon={ribbon.length > 0 ? <HistoryRibbon events={ribbon} /> : null}
      />
    </>
  );
}
