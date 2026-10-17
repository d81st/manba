import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMessages, plural } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getAyahs, SEARCH_LIMIT, searchText, type SearchResult } from "@/lib/quran";
import { highlight, likePatterns, parseQuery } from "@/lib/quran-query";
import { SearchForm } from "../search-form";
import styles from "../quran.module.css";

const t = getMessages().quran;

export const metadata: Metadata = { title: t.search.title };

export default function SearchPage({ searchParams }: PageProps<"/quran/search">) {
  return (
    <main className="container">
      <nav className={styles.crumbs}>
        <Link href="/quran">← {t.allSuras}</Link>
      </nav>
      <h1 className={styles.title}>{t.search.title}</h1>
      <Suspense fallback={<SearchForm />}>
        <Search searchParams={searchParams} />
      </Suspense>
    </main>
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
      <p className={`muted ${styles.hint}`}>{t.search.hint}</p>
      <Results parsed={parsed} />
    </>
  );
}

async function Results({ parsed }: { parsed: ReturnType<typeof parseQuery> }) {
  switch (parsed.kind) {
    case "empty":
      return null;
    case "invalid":
      return <p className={styles.message}>{t.search.invalid}</p>;
    case "unsupported":
      return <p className={styles.message}>{t.search.unsupported}</p>;
    case "sura":
      return (
        <p className={styles.message}>
          <Link href={`/quran/${parsed.sura}`}>
            {t.search.openSura} {parsed.sura} →
          </Link>
        </p>
      );
  }

  if (!isDatabaseConfigured()) return <p className="error">{t.noDatabase}</p>;

  let result: SearchResult;
  let words: string[] = [];
  let diacritics = false;
  if (parsed.kind === "ayahs") {
    result = await getAyahs(parsed.sura, parsed.from, parsed.to);
    if (result.total === 0) return <p className={styles.message}>{t.search.noAyah}</p>;
  } else {
    ({ words, diacritics } = parsed);
    result = await searchText(likePatterns(words), diacritics);
    if (result.total === 0) return <p className={styles.message}>{t.search.nothing}</p>;
  }

  return (
    <section>
      <p className={styles.message}>
        {t.search.found}: {plural(result.total, t.ayahs)}
        {diacritics && ` (${t.search.withDiacritics})`}
        {result.total > SEARCH_LIMIT && (
          <span className="muted"> {t.search.limited.replace("{limit}", String(SEARCH_LIMIT))}</span>
        )}
      </p>
      <ol className={styles.ayahs}>
        {result.hits.map((hit) => (
          <li key={hit.address} className={styles.ayah}>
            <Link href={`/quran/${hit.sura}#${hit.sura}-${hit.ayah}`} className={styles.ref}>
              {hit.sura}:{hit.ayah}
              <span className={styles.refName}>{hit.suraName}</span>
            </Link>
            <p className={`quran ${styles.ayahText}`} lang="ar" dir="rtl">
              {highlight(hit.text, words, diacritics, hit.alt).map((piece, i) =>
                piece.match ? <mark key={i}>{piece.text}</mark> : piece.text,
              )}
            </p>
          </li>
        ))}
      </ol>
      <footer className={`muted ${styles.attribution}`}>
        {t.search.sourceNote}{" "}
        <a href="https://tanzil.net" target="_blank" rel="noreferrer">
          Tanzil Project (tanzil.net)
        </a>
        , CC BY 3.0, {t.unchanged}.
      </footer>
    </section>
  );
}
