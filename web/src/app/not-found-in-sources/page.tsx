import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { NotFoundList } from "@/modules/findings";
import { listPublicNotFound } from "@/modules/findings/server";

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
  return <NotFoundList findings={findings} />;
}
