import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { getMessages } from "@/i18n";
import { getBookSection, getBookWork, sectionHref } from "@/lib/books";
import { isDatabaseConfigured } from "@/lib/db";
import { HadithAttribution } from "../../../../hadith/attribution";
import { BookSearchForm } from "../../search-form";

const messages = getMessages();
const t = messages.library;

export const metadata: Metadata = { title: t.title };

export default function BookSectionPage({ params, searchParams }: PageProps<"/library/[work]/s/[section]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{messages.hadith.loading}</p>}>
        <SectionText params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

// Paragraphs of the source, separated by a blank line.
function ArabicText({ text }: { text: string }) {
  return (
    <div className="flex-1" lang="ar" dir="rtl">
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} className="ar text-[1.3rem] leading-[2.1] sm:text-[1.4rem]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

async function SectionText({
  params,
  searchParams,
}: {
  params: PageProps<"/library/[work]/s/[section]">["params"];
  searchParams: PageProps<"/library/[work]/s/[section]">["searchParams"];
}) {
  await connection();
  const [{ work, section: raw }, { page: rawPage }] = await Promise.all([params, searchParams]);
  const page = typeof rawPage === "string" && /^\d{1,3}$/.test(rawPage) ? Number(rawPage) : 1;
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !/^\d{1,4}$/.test(raw) || !isDatabaseConfigured()) notFound();
  const [book, section] = await Promise.all([getBookWork(work), getBookSection(work, Number(raw), page)]);
  if (!book || !section) notFound();
  const tafsir = book.category === "tafsir";
  // In a tafsir: "2:63–64" for a comment on two ayahs, words for the surah's opening and the introduction.
  const label = (piece: (typeof section.chapters)[number]["pieces"][number]) => {
    if (!tafsir) return `${book.shortTitle} ${piece.label}`;
    const [sura, ayah] = piece.path;
    if (sura === 0) return `${t.book.introduction} ${ayah}`;
    if (ayah === 0) return t.book.opening;
    const last = piece.ayahs[piece.ayahs.length - 1];
    return `${book.shortTitle} ${piece.label}${last && last !== ayah ? `–${last}` : ""}`;
  };

  // Pages of a long section, then the sections before and after it.
  const back =
    section.page > 1
      ? { href: sectionHref(work, section.number, section.page - 1), label: messages.hadith.previousPage }
      : section.previous !== null
        ? { href: sectionHref(work, section.previous), label: t.book.previous }
        : null;
  const forward =
    section.page < section.pages
      ? { href: sectionHref(work, section.number, section.page + 1), label: messages.hadith.nextPage }
      : section.next !== null
        ? { href: sectionHref(work, section.next), label: t.book.next }
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
      {section.pages > 1 && (
        <span className="text-muted-foreground tabular-nums">
          {messages.hadith.page} {section.page} {messages.hadith.of} {section.pages}
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
        <Link href={`/library/${work}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {book.title} · {t.book.allSections}
        </Link>
      </nav>
      <BookSearchForm work={work} tafsir={tafsir} />
      <header className="flex flex-col gap-1 border-b pt-3 pb-4">
        <p className="text-sm text-muted-foreground">
          {tafsir
            ? section.number === 0
              ? t.book.introduction
              : `${t.book.surah} ${section.number}`
            : `${t.book.section} ${section.number}`}
        </p>
        <h1 className="ar text-3xl leading-loose" lang="ar" dir="rtl">
          {section.title || (tafsir && section.number > 0 ? book.sections.find((s) => s.number === section.number)?.title : "")}
        </h1>
      </header>
      {section.pages > 1 && nav}

      {section.chapters.map((chapter) => (
        <section key={chapter.index} className="border-b py-4">
          {chapter.title && (
            <h2
              className={`ar font-semibold leading-loose text-primary ${tafsir && section.number > 0 ? "quran text-2xl" : "text-xl"}`}
              lang="ar"
              dir="rtl"
            >
              {chapter.title}
            </h2>
          )}
          <ol>
            {chapter.pieces.map((piece) => (
              <li
                key={piece.anchor}
                id={piece.anchor}
                className="flex scroll-mt-4 flex-col gap-1 border-t py-3 first:border-t-0 target:bg-highlight sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="flex min-w-24 shrink-0 flex-col gap-0.5">
                  <a href={`#${piece.anchor}`} className="text-sm font-medium tabular-nums no-underline">
                    {label(piece)}
                  </a>
                  {piece.ayahs.length > 0 && (
                    <Link href={`/quran/${piece.path[0]}#${piece.path[0]}-${piece.ayahs[0]}`} className="text-xs">
                      {t.book.quran} {piece.path[0]}:{piece.ayahs[0]}
                      {piece.ayahs.length > 1 && `–${piece.ayahs[piece.ayahs.length - 1]}`}
                    </Link>
                  )}
                </span>
                <ArabicText text={piece.text} />
              </li>
            ))}
          </ol>
        </section>
      ))}
      <ScrollToHash />
      {nav}
      <HadithAttribution collection={book} />
    </>
  );
}
