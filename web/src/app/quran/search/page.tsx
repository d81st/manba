import type { Metadata } from "next";
import { CircleAlert, Info } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMessages, plural } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getAyahs, SEARCH_LIMIT, searchText, type SearchResult } from "@/lib/quran";
import { highlight, likePatterns, parseQuery } from "@/lib/quran-query";
import { QuranNav } from "../nav";
import { SearchForm } from "../search-form";

const t = getMessages().quran;

export const metadata: Metadata = { title: t.search.title };

export default function SearchPage({ searchParams }: PageProps<"/quran/search">) {
  return (
    <Page>
      <QuranNav current="search" />
      <h1 className="mt-3 text-2xl font-semibold">{t.search.title}</h1>
      <Suspense fallback={<SearchForm />}>
        <Search searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Search({ searchParams }: { searchParams: PageProps<"/quran/search">["searchParams"] }) {
  await connection();
  const raw = (await searchParams).q;
  const query = typeof raw === "string" ? raw : "";
  const parsed = parseQuery(query);

  return (
    <>
      <SearchForm query={query} />
      <p className="mb-2 text-sm text-muted-foreground">{t.search.hint}</p>
      <Results parsed={parsed} />
    </>
  );
}

async function Results({ parsed }: { parsed: ReturnType<typeof parseQuery> }) {
  switch (parsed.kind) {
    case "empty":
      return null;
    case "invalid":
      return <Notice kind="warning">{t.search.invalid}</Notice>;
    case "unsupported":
      return <Notice kind="info">{t.search.unsupported}</Notice>;
    case "sura":
      return (
        <p className="mt-4">
          <Link href={`/quran/${parsed.sura}`}>
            {t.search.openSura} {parsed.sura} →
          </Link>
        </p>
      );
  }

  if (!isDatabaseConfigured()) return <Notice kind="warning">{t.noDatabase}</Notice>;

  let result: SearchResult;
  let words: string[] = [];
  let diacritics = false;
  if (parsed.kind === "ayahs") {
    result = await getAyahs(parsed.sura, parsed.from, parsed.to);
    if (result.total === 0) return <Notice kind="info">{t.search.noAyah}</Notice>;
  } else {
    ({ words, diacritics } = parsed);
    result = await searchText(likePatterns(words), diacritics);
    if (result.total === 0) return <Notice kind="info">{t.search.nothing}</Notice>;
  }

  return (
    <section>
      <p className="mt-4">
        {t.search.found}: {plural(result.total, t.ayahs)}
        {diacritics && ` (${t.search.withDiacritics})`}
        {result.total > SEARCH_LIMIT && (
          <span className="text-muted-foreground"> {t.search.limited.replace("{limit}", String(SEARCH_LIMIT))}</span>
        )}
      </p>
      <ol className="mt-2 mb-6">
        {result.hits.map((hit) => (
          <li key={hit.address} className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:items-baseline sm:gap-4">
            <Link
              href={`/quran/${hit.sura}#${hit.sura}-${hit.ayah}`}
              className="min-w-24 shrink-0 text-xs tabular-nums text-muted-foreground no-underline"
            >
              {hit.sura}:{hit.ayah}
              <span className="block">{hit.suraName}</span>
            </Link>
            <p className="quran flex-1 text-[1.55rem] leading-[2.3] sm:text-[1.75rem]" lang="ar" dir="rtl">
              {highlight(hit.text, words, diacritics, hit.alt).map((piece, i) =>
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
      <footer className="border-t pt-4 text-sm text-muted-foreground">
        {t.search.sourceNote}{" "}
        <a href="https://tanzil.net" target="_blank" rel="noreferrer">
          Tanzil Project (tanzil.net)
        </a>
        , CC BY 3.0, {t.unchanged}.
      </footer>
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
