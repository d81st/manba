import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { EXTERNAL_WORKS, externalBook, isExternal } from "@/lib/external";
import { getExternalChapter } from "@/lib/external-texts";
import { cn } from "@/lib/utils";

const messages = getMessages();
const t = messages.external;

export const metadata: Metadata = { title: t.title };

// A chapter: the original and the translation verse by verse; /…/21#24 opens at verse 24.
export default function ExternalChapterPage({ params }: PageProps<"/external/[work]/[book]/[chapter]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Chapter params={params} />
      </Suspense>
    </Page>
  );
}

async function Chapter({ params }: Pick<PageProps<"/external/[work]/[book]/[chapter]">, "params">) {
  await connection();
  const { work, book: rawBook, chapter: rawChapter } = await params;
  if (!isExternal(work) || !/^\d{1,3}$/.test(rawBook) || !/^\d{1,3}$/.test(rawChapter) || !isDatabaseConfigured()) notFound();
  const book = externalBook(work, Number(rawBook));
  const chapter = Number(rawChapter);
  const data = book ? await getExternalChapter(work, book.n, chapter) : null;
  if (!book || !data) notFound();
  const name = `${EXTERNAL_WORKS[work].prefix}${book.ru}`;
  const href = (c: number) => `/external/${work}/${book.n}/${c}`;
  const pager = (
    <nav className="flex justify-between text-sm">
      {data.previous ? <Link href={href(data.previous)}>← {t.previous}</Link> : <span />}
      {data.next ? <Link href={href(data.next)}>{t.next} →</Link> : <span />}
    </nav>
  );
  return (
    <>
      <ScrollToHash />
      <nav className="mt-6 text-sm">
        <Link href={`/external/${work}`}>← {t.works[work]}</Link>
      </nav>
      <header className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-b pb-3">
        <h1 className="text-2xl font-semibold">
          {name} {chapter}
        </h1>
        {book.original && (
          <span lang="he" dir="rtl" className="text-2xl">
            {book.original}
          </span>
        )}
      </header>
      {data.hasTranslation && <p className="mt-2 text-xs text-muted-foreground">{t.translationNote}</p>}
      <div className="mt-3">{pager}</div>
      <ol className="mt-3 border-t">
        {data.verses.map((v) => (
          <li
            key={v.n}
            id={String(v.n)}
            className="grid scroll-mt-4 gap-2 border-b py-3 target:bg-highlight md:grid-cols-[3rem_1fr_1fr] md:gap-6"
          >
            <a href={`#${v.n}`} className="text-xs tabular-nums text-muted-foreground no-underline">
              {chapter}:{v.n}
            </a>
            <p lang={data.language} dir={data.dir} className={cn("leading-relaxed", data.dir === "rtl" ? "text-xl" : "text-lg")}>
              {v.original}
            </p>
            <p className="leading-relaxed text-muted-foreground">{v.translation}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4">{pager}</div>
      <p className="mt-6 mb-8 text-xs text-muted-foreground">{t.credits[work]}</p>
    </>
  );
}
