import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { isDatabaseConfigured } from "@/shared/db";
import { filterTopics, listFilterOf, TopicList } from "@/modules/topics";
import { listPublishedTopics } from "@/modules/topics/server";

const messages = getMessages();
const t = messages.topics;

export const metadata: Metadata = { title: t.title };

export default function TopicsPage({ searchParams }: PageProps<"/topics">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Topics searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Topics({ searchParams }: { searchParams: PageProps<"/topics">["searchParams"] }) {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const filter = listFilterOf((await searchParams).category);
  const topics = filterTopics(await listPublishedTopics(), filter);
  return <TopicList topics={topics} active={filter} />;
}
