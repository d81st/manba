import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { PreviewLink } from "../../preview-link";
import { StatusBadge } from "../../status-badge";
import { getQuestionForEdit, listQuizChoices } from "@/modules/quiz/server";
import { QuestionForm, type QuestionInput } from "@/modules/quiz";

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
  await requireAdmin();
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
