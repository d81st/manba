import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { getQuestionForEdit, listQuizChoices } from "@/lib/quiz";
import type { QuestionInput } from "@/lib/quiz-input";
import { PreviewLink } from "../../preview-link";
import { StatusBadge } from "../../status-badge";
import { QuestionForm } from "../question-form";

const messages = getMessages();
const t = messages.admin.tests;

export const metadata: Metadata = { title: t.title };

export default function EditQuestionPage({ params, searchParams }: PageProps<"/admin/tests/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/tests">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditQuestion params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditQuestion({ params, searchParams }: Pick<PageProps<"/admin/tests/[id]">, "params" | "searchParams">) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const question = await getQuestionForEdit(Number(raw));
  if (!question) notFound();
  const { topics, terms } = await listQuizChoices();
  const saved = (await searchParams).saved === "1";
  const { id, ...rest } = question;
  const initial = { ...rest, status: rest.status as QuestionInput["status"] };
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{question.prompt || `#${id}`}</h1>
        <StatusBadge status={question.status} />
        <PreviewLink href={`/tests#q-${id}`} className="text-sm">
          {t.preview}
        </PreviewLink>
      </div>
      <QuestionForm key={`${id}-${question.status}`} id={id} initial={initial} topics={topics} terms={terms} saved={saved} messages={messages} />
    </>
  );
}
