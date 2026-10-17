import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listPublishedTerms } from "@/lib/glossary";
import { GlossaryList } from "./glossary-list";

const t = getMessages().glossary;

export const metadata: Metadata = { title: t.title };

export default function GlossaryPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Terms />
      </Suspense>
    </Page>
  );
}

async function Terms() {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{getMessages().quran.noDatabase}</p>;
  const terms = await listPublishedTerms();
  return <GlossaryList terms={terms} t={t} />;
}
