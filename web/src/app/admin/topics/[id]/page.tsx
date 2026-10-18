import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listTermChoices } from "@/lib/glossary";
import { getTopicForEdit, listSides, listTopicChoices } from "@/lib/topics";
import { StatusBadge } from "../../status-badge";
import { TopicForm } from "../topic-form";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.topics.editTitle };

export default function EditTopicPage({ params, searchParams }: PageProps<"/admin/topics/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/topics">← {t.topics.title}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditTopic params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditTopic({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/topics/[id]">["params"];
  searchParams: PageProps<"/admin/topics/[id]">["searchParams"];
}) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const topic = await getTopicForEdit(Number(raw));
  if (!topic) notFound();
  const [sides, terms, topics] = await Promise.all([listSides(), listTermChoices(), listTopicChoices()]);
  const saved = (await searchParams).saved === "1";
  const { id, ...initial } = topic;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{topic.title}</h1>
        {topic.category === "hard" && <Badge variant="secondary">{t.categories.hard}</Badge>}
        <StatusBadge status={topic.status} />
        {topic.status === "published" && (
          <Link href={`/topics/${topic.slug}`} className="inline-flex items-center gap-1 text-sm">
            <ExternalLink className="size-4" />
            {t.topics.view}
          </Link>
        )}
      </div>
      <TopicForm
        key={`${id}-${topic.status}`}
        id={id}
        initial={initial}
        sides={sides}
        termChoices={terms}
        topicChoices={topics.filter((choice) => choice.id !== id)}
        saved={saved}
        t={t}
      />
    </>
  );
}
