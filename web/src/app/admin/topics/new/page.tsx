import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listTermChoices } from "@/lib/glossary";
import { listSides, listTopicChoices } from "@/lib/topics";
import { TopicForm } from "../topic-form";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.topics.newTitle };

export default function NewTopicPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/topics">← {t.topics.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.topics.newTitle}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewTopic />
      </Suspense>
    </Page>
  );
}

async function NewTopic() {
  await connection();
  await requireSession();
  const [sides, terms, topics] = await Promise.all([listSides(), listTermChoices(), listTopicChoices()]);
  return (
    <TopicForm id={null} initial={null} sides={sides} termChoices={terms} topicChoices={topics} saved={false} t={t} />
  );
}
