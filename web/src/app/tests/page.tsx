import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { isDatabaseConfigured } from "@/shared/db";
import { levelKey, QuizList } from "@/modules/quiz";
import { getQuizQuestions } from "@/modules/quiz/server";
import { isPreview } from "@/shared/auth/preview";
import { PreviewBar } from "@/shared/layout/preview";

const messages = getMessages();
const t = messages.tests;

export const metadata: Metadata = { title: t.title };

// «Тесты» (docs/PLAN.md, migration 023): after any answer, the fragments the
// question is built on, with links into the library; the level is the
// authority of those fragments.
export default function TestsPage({ searchParams }: PageProps<"/tests">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Tests searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Tests({ searchParams }: Pick<PageProps<"/tests">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const preview = await isPreview(params);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const all = await getQuizQuestions(preview);
  const levels = [...new Set(all.map((q) => levelKey(q.level)))].sort((a, b) => (a ?? 99) - (b ?? 99));
  const wanted = typeof params.level === "string" ? params.level : null;
  const questions = all.filter((q) => !wanted || String(levelKey(q.level) ?? "none") === wanted);
  const href = (level: string | null) => {
    const next = new URLSearchParams();
    if (level) next.set("level", level);
    if (preview) next.set("drafts", "1");
    const s = next.toString();
    return s ? `/tests?${s}` : "/tests";
  };

  return (
    <>
      <PreviewBar href="/tests" preview={preview} />
      {all.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t.empty} <Link href="/admin/tests">{t.drafts}</Link>
        </p>
      ) : (
        <QuizList questions={questions} levels={levels} wanted={wanted} href={href} />
      )}
    </>
  );
}
