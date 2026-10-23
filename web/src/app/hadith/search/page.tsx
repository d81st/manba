import { CircleAlert, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMessages, plural } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { HADITH_SEARCH_LIMIT, searchHadith } from "@/lib/hadith";
import { COLLECTION_NAMES, hadithAnchor, hadithLabel, hadithPath, parseHadithQuery } from "@/lib/hadith-query";
import { highlight, likePatterns } from "@/lib/quran-query";
import { HadithSearchForm } from "../search-form";

const messages = getMessages();
const t = messages.hadith;

export const metadata: Metadata = { title: t.search.title };

export default function HadithSearchPage({ searchParams }: PageProps<"/hadith/search">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/hadith">← {t.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.search.title}</h1>
      <Suspense fallback={<HadithSearchForm />}>
        <Search searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Search({ searchParams }: { searchParams: PageProps<"/hadith/search">["searchParams"] }) {
  await connection();
  const { q: raw, work } = await searchParams;
  const query = typeof raw === "string" ? raw : "";
  const collection = typeof work === "string" && work in COLLECTION_NAMES ? work : undefined;
  const parsed = parseHadithQuery(query, collection);
  if (parsed.kind === "number") redirect(hadithPath(parsed.work, parsed.number, parsed.variant));

  return (
    <>
      <HadithSearchForm query={query} work={collection} />
      <p className="mb-2 text-sm text-muted-foreground">{t.search.hint}</p>
      {parsed.kind === "unsupported" && <Notice kind="info">{t.search.unsupported}</Notice>}
      {parsed.kind === "text" && <Results words={parsed.words} diacritics={parsed.diacritics} />}
    </>
  );
}

async function Results({ words, diacritics }: { words: string[]; diacritics: boolean }) {
  if (!isDatabaseConfigured()) return <Notice kind="warning">{messages.quran.noDatabase}</Notice>;
  const result = await searchHadith(likePatterns(words), diacritics);
  if (result.total === 0) return <Notice kind="info">{t.search.nothing}</Notice>;

  return (
    <section>
      <p className="mt-4">
        {t.search.found}: {plural(result.total, t.hadiths)}
        {diacritics && ` (${t.search.withDiacritics})`}
        {result.total > HADITH_SEARCH_LIMIT && (
          <span className="text-muted-foreground">
            {" "}
            {t.search.limited.replace("{limit}", String(HADITH_SEARCH_LIMIT))}
          </span>
        )}
      </p>
      <ol className="mt-2 mb-6">
        {result.hits.map((hit) => (
          <li
            key={`${hit.work}-${hadithAnchor(hit.number, hit.variant)}`}
            className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <Link
              href={`/hadith/${hit.work}/book/${hit.book}#${hadithAnchor(hit.number, hit.variant)}`}
              className="min-w-24 shrink-0 text-sm tabular-nums no-underline"
            >
              {hit.workTitle.replace(/^Сахих /, "")} {hadithLabel(hit.number, hit.variant, hit.variants)}
            </Link>
            <p className="ar flex-1 text-[1.3rem] leading-[2.1]" lang="ar" dir="rtl">
              {highlight(hit.text, words, diacritics).map((piece, i) =>
                piece.match ? (
                  <mark key={i} className="rounded bg-highlight text-inherit">
                    {piece.text}
                  </mark>
                ) : (
                  piece.text
                ),
              )}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Notice({ kind, children }: { kind: "info" | "warning"; children: React.ReactNode }) {
  const Icon = kind === "info" ? Info : CircleAlert;
  return (
    <Alert variant={kind === "warning" ? "destructive" : "default"} className="mt-4">
      <Icon className="size-4" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
