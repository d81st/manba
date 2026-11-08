import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { KnowledgeMap } from "@/modules/knowledge";
import { getKnowledgeMap } from "@/modules/knowledge/server";
import { isDatabaseConfigured } from "@/shared/db";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";

const messages = getMessages();
const t = messages.knowledge;

export const metadata: Metadata = { title: t.title };

export default function KnowledgePage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Knowledge />
      </Suspense>
    </Page>
  );
}

async function Knowledge() {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const data = await getKnowledgeMap();
  if (data.items.every((i) => i.kind === "section")) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return <KnowledgeMap data={data} />;
}
