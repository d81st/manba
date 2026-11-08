import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { ask, recordMiss } from "@/modules/assistant/server";
import { MAX_QUESTION } from "@/modules/assistant";
import { Answer, AskForm, Examples } from "@/modules/assistant";

const messages = getMessages();
const t = messages.assistant;

export const metadata: Metadata = { title: t.title };


// «Ассистент по источникам», first phase (docs/PLAN.md, migration 024).
export default function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Assistant searchParams={searchParams} />
      </Suspense>
      <p className="mt-8 text-xs text-muted-foreground">{t.note}</p>
    </Page>
  );
}

async function Assistant({ searchParams }: Pick<PageProps<"/assistant">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, MAX_QUESTION) : "";
  const view = params.view === "graph" ? "graph" : "list";
  const href = (patch: Record<string, string>) => `/assistant?${new URLSearchParams({ q, view, ...patch }).toString()}`;

  if (!q.trim()) {
    return (
      <>
        <AskForm q={q} view={view} />
        <Examples />
        <p className="mt-6 text-muted-foreground">{t.empty}</p>
      </>
    );
  }
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;

  const result = await ask(q);
  if (result.quran.length + result.hadith.length + result.pages.length === 0) await recordMiss(result.analysis);

  return (
    <>
      <AskForm q={q} view={view} />
      <Answer result={result} view={view} href={href} />
    </>
  );
}
