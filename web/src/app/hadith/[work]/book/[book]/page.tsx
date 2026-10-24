import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { bookPageHref, getBook, getCollection } from "@/lib/hadith";
import { hadithAnchor, refLabel } from "@/lib/hadith-query";
import { HadithAttribution } from "../../../attribution";

const t = getMessages().hadith;

export const metadata: Metadata = { title: t.title };

export default function BookPage({ params, searchParams }: PageProps<"/hadith/[work]/book/[book]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{t.loading}</p>}>
        <BookText params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

// Paragraphs of the source, separated by a blank line.
function ArabicText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className} lang="ar" dir="rtl">
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} className="ar text-[1.3rem] leading-[2.1] sm:text-[1.4rem]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

async function BookText({
  params,
  searchParams,
}: {
  params: PageProps<"/hadith/[work]/book/[book]">["params"];
  searchParams: PageProps<"/hadith/[work]/book/[book]">["searchParams"];
}) {
  await connection();
  const [{ work, book: raw }, { page: rawPage }] = await Promise.all([params, searchParams]);
  const page = typeof rawPage === "string" && /^\d{1,4}$/.test(rawPage) ? Number(rawPage) : 1;
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !/^\d{1,4}$/.test(raw) || !isDatabaseConfigured()) notFound();
  const [collection, book] = await Promise.all([getCollection(work), getBook(work, Number(raw), page)]);
  if (!collection || !book) notFound();

  // Pages of a long book, then the books before and after it.
  const back =
    book.page > 1
      ? { href: bookPageHref(work, book.number, book.page - 1), label: t.previousPage }
      : book.previous !== null
        ? { href: bookPageHref(work, book.previous), label: t.previous }
        : null;
  const forward =
    book.page < book.pages
      ? { href: bookPageHref(work, book.number, book.page + 1), label: t.nextPage }
      : book.next !== null
        ? { href: bookPageHref(work, book.next), label: t.next }
        : null;
  const nav = (
    <nav className="flex items-center justify-between gap-4 py-4 text-sm">
      {back ? (
        <Link href={back.href} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      ) : (
        <span />
      )}
      {book.pages > 1 && (
        <span className="text-muted-foreground tabular-nums">
          {t.page} {book.page} {t.of} {book.pages}
        </span>
      )}
      {forward ? (
        <Link href={forward.href} className="inline-flex items-center gap-1">
          {forward.label}
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );

  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href={`/hadith/${work}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {collection.title} · {t.allBooks}
        </Link>
      </nav>
      <header className="flex flex-col gap-1 border-b pt-3 pb-4">
        <p className="text-sm text-muted-foreground">{book.number === 0 ? t.preface : `${t.book} ${book.number}`}</p>
        <h1 className="ar text-3xl leading-loose" lang="ar" dir="rtl">
          {book.title}
        </h1>
      </header>
      {book.pages > 1 && nav}

      {book.chapters.map((chapter) => (
        <section key={chapter.index} className="border-b py-4">
          {chapter.title && (
            <h2 className="ar text-xl font-semibold leading-loose text-primary" lang="ar" dir="rtl">
              {chapter.title}
            </h2>
          )}
          {chapter.continued && <p className="text-sm text-muted-foreground">{t.continued}</p>}
          {chapter.intro && <ArabicText text={chapter.intro} className="text-muted-foreground" />}
          <ol>
            {chapter.hadiths.map((hadith) => (
              <li
                key={hadithAnchor(hadith.path)}
                id={hadithAnchor(hadith.path)}
                className="flex scroll-mt-4 flex-col gap-1 border-t py-4 first:border-t-0 target:bg-highlight sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="flex min-w-20 shrink-0 flex-col gap-1">
                  <a
                    href={`#${hadithAnchor(hadith.path)}`}
                    className="text-sm font-medium tabular-nums no-underline"
                  >
                    {collection.shortTitle} {refLabel(collection.scheme, hadith.path, hadith.variants)}
                  </a>
                  {hadith.numbering !== "marker" && (
                    <Badge variant="outline" className="w-fit text-[0.7rem]" title={t.inferredHint}>
                      {t.inferred}
                    </Badge>
                  )}
                </span>
                <ArabicText text={hadith.text} className="flex-1" />
              </li>
            ))}
          </ol>
          {chapter.unnumbered && (
            <div className="mt-2 rounded-lg border border-dashed p-3">
              <p className="mb-1 text-sm font-medium">{t.unnumbered}</p>
              <p className="mb-2 text-xs text-muted-foreground">{t.unnumberedHint}</p>
              <ArabicText text={chapter.unnumbered} />
            </div>
          )}
        </section>
      ))}
      <ScrollToHash />
      {nav}
      <HadithAttribution collection={collection} />
    </>
  );
}
