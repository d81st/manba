import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { EXTERNAL_IDS } from "@/lib/external";
import { listParallels } from "@/lib/parallels";
import { TRADITIONS } from "@/lib/parallels-input";
import { isPreview, PreviewNote } from "../sira/shared";

const messages = getMessages();
const t = messages.origins;

export const metadata: Metadata = { title: t.title };

// «Истоки и связи с другими учениями» (docs/PLAN.md): links between passages
// of Islam's sources and texts of other religions, grouped by teaching.
export default function OriginsPage({ searchParams }: PageProps<"/origins">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Links searchParams={searchParams} />
      </Suspense>
      <section className="mt-10 mb-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.library}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.libraryHint}</p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {EXTERNAL_IDS.map((work) => (
            <li key={work}>
              <Link href={`/external/${work}`}>{messages.external.works[work]}</Link>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}

async function Links({ searchParams }: Pick<PageProps<"/origins">, "searchParams">) {
  await connection();
  const preview = isPreview(await searchParams);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const parallels = await listParallels(preview);
  const suffix = preview ? "?drafts=1" : "";
  return (
    <>
      <div className="mt-2 flex justify-end text-sm">
        <Link href={preview ? "/origins" : "/origins?drafts=1"} className="text-muted-foreground">
          {preview ? messages.sira.publishedLink : messages.sira.previewLink}
        </Link>
      </div>
      <PreviewNote preview={preview} />
      {parallels.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t.empty} <Link href="/admin/origins">{t.drafts}</Link>
        </p>
      ) : (
        TRADITIONS.filter((tr) => parallels.some((p) => p.tradition === tr)).map((tradition) => (
          <section key={tradition} className="mt-6">
            <h2 className="mb-3 text-lg font-semibold">{t.traditions[tradition]}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {parallels
                .filter((p) => p.tradition === tradition)
                .map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/origins/${p.slug}${suffix}`}
                      className="flex h-full flex-col gap-2 rounded-xl border bg-card px-4 py-3 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
                    >
                      <span className="font-medium">{p.title}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {p.islam} ↔ {p.external}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{t.kinds[p.kind as keyof typeof t.kinds]}</Badge>
                        <Badge variant="outline">{t.degrees[p.degree as keyof typeof t.degrees]}</Badge>
                        {p.status !== "published" && <Badge variant="outline">{t.draft}</Badge>}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
