import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listQuizChoices } from "@/lib/quiz";
import { QuestionForm } from "../question-form";

const messages = getMessages();
const t = messages.admin.tests;

export const metadata: Metadata = { title: t.add };

export default function NewQuestionPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/tests">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.add}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewQuestion />
      </Suspense>
    </Page>
  );
}

async function NewQuestion() {
  await connection();
  await requireSession();
  const { topics, terms } = await listQuizChoices();
  return <QuestionForm id={null} initial={null} topics={topics} terms={terms} saved={false} messages={messages} />;
}
