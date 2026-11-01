import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LinkedParagraphs } from "@/components/linked-text";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listPublicNotFound } from "@/lib/findings";
import { leadHost } from "@/lib/findings-input";

const messages = getMessages();
const t = messages.notFoundInSources;

export const metadata: Metadata = { title: t.title };

// «Не найдено в источниках» (migration 025): checked leads whose text is not
// where they say it is. The lead is named by its site only, not linked.
export default function NotFoundInSourcesPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <List />
      </Suspense>
    </Page>
  );
}

async function List() {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const findings = await listPublicNotFound();
  if (findings.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return (
    <ul className="mt-6 space-y-4">
      {findings.map((f) => (
        <li key={f.id} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-muted-foreground">{t.claimed}</dt>
            <dd className="font-medium">{f.claimedSource}</dd>
            <dt className="text-sm text-muted-foreground">{t.words}</dt>
            <dd dir="auto" className="whitespace-pre-line">
              {f.claimedText}
            </dd>
            <dt className="text-sm text-muted-foreground">{t.searched}</dt>
            <dd className="text-sm">
              <LinkedParagraphs text={f.searched} />
            </dd>
            {f.note && (
              <>
                <dt className="text-sm text-muted-foreground">{t.note}</dt>
                <dd className="text-sm">
                  <LinkedParagraphs text={f.note} />
                </dd>
              </>
            )}
            <dt className="text-sm text-muted-foreground">{t.checked}</dt>
            <dd className="text-sm">
              {f.updatedAt}
              {leadHost(f.leadUrl) && (
                <span className="text-muted-foreground">
                  {" "}
                  · {t.lead}: {leadHost(f.leadUrl)}
                </span>
              )}
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
