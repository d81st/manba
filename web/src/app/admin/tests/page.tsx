import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listQuestionsForAdmin } from "@/lib/quiz";
import { levelKey } from "@/lib/quiz-input";
import { PreviewLink } from "../preview-link";
import { StatusBadge } from "../status-badge";

const messages = getMessages();
const t = messages.admin.tests;

export const metadata: Metadata = { title: t.title };

export default function AdminTestsPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/tests/new">+ {t.add}</Link>
        <PreviewLink href="/tests">{t.preview}</PreviewLink>
      </div>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Questions />
      </Suspense>
    </Page>
  );
}

async function Questions() {
  await connection();
  await requireSession();
  const questions = await listQuestionsForAdmin();
  if (questions.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return (
    <ul className="mt-6 divide-y rounded-xl border bg-card">
      {questions.map((q) => {
        const key = levelKey(q.level);
        return (
          <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Link href={`/admin/tests/${q.id}`} className="font-medium">
              {q.prompt || `#${q.id}`}
            </Link>
            <StatusBadge status={q.status} />
            <Badge variant="outline">
              {key ? messages.tests.levelN.replace("{n}", String(key)) : messages.tests.noLevel}
            </Badge>
            <span className="ms-auto text-sm text-muted-foreground">
              {t.answers}: {q.options.length}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
