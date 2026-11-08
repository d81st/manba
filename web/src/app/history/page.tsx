import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { HISTORY_LAYERS, HistoryTimeline, SCALES, type Scale } from "@/modules/history";
import { getHistoryEvents } from "@/modules/history/server";
import { isPreview } from "@/lib/preview";
import { PreviewBar } from "../sira/shared";

const messages = getMessages();
const t = messages.history;

export const metadata: Metadata = { title: t.title };

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

  return (
    <>
      <PreviewBar href="/history" preview={preview} />
      <HistoryTimeline events={events} layer={layer} scale={scale} preview={preview} query={query} />
    </>
  );
}
