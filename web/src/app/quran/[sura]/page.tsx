import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getSura } from "@/lib/quran";
import { SuraMeta } from "../sura-meta";
import { ScrollToHash } from "./scroll-to-hash";
import styles from "../quran.module.css";

const t = getMessages().quran;

export const metadata: Metadata = { title: t.title };

export default function SuraPage({ params }: PageProps<"/quran/[sura]">) {
  return (
    <main className="container">
      <Suspense fallback={<p className={`muted ${styles.title}`}>{t.loading}</p>}>
        <SuraText params={params} />
      </Suspense>
    </main>
  );
}

async function SuraText({ params }: { params: PageProps<"/quran/[sura]">["params"] }) {
  await connection();
  const { sura: raw } = await params;
  const number = Number(raw);
  if (!/^\d+$/.test(raw) || number < 1 || number > 114) notFound();
  if (!isDatabaseConfigured()) return <p className="error">{t.noDatabase}</p>;

  const sura = await getSura(number);
  if (!sura) notFound();

  return (
    <>
      <nav className={styles.crumbs}>
        <Link href="/quran">← {t.allSuras}</Link>
      </nav>
      <header className={styles.suraHeader}>
        <h1 className={styles.title}>
          {t.sura} {sura.number} · {sura.names.translit}
        </h1>
        <p className={`quran ${styles.suraArabic}`} lang="ar" dir="rtl">
          {sura.names.ar}
        </p>
        <SuraMeta sura={sura} />
      </header>

      <ol className={styles.ayahs}>
        {sura.segments.map((segment) =>
          segment.level === "basmala" ? (
            <li key={segment.address} className={styles.basmala}>
              <p className="quran" lang="ar" dir="rtl">
                {segment.text}
              </p>
            </li>
          ) : (
            <li key={segment.address} id={`${sura.number}-${segment.number}`} className={styles.ayah}>
              <a href={`#${sura.number}-${segment.number}`} className={styles.ref}>
                {sura.number}:{segment.number}
              </a>
              <p className={`quran ${styles.ayahText}`} lang="ar" dir="rtl">
                {segment.text}
              </p>
            </li>
          ),
        )}
      </ol>
      <ScrollToHash />

      <nav className={styles.pager}>
        {number > 1 ? <Link href={`/quran/${number - 1}`}>← {t.previous}</Link> : <span />}
        {number < 114 && <Link href={`/quran/${number + 1}`}>{t.next} →</Link>}
      </nav>

      {sura.attribution && (
        <footer className={`muted ${styles.attribution}`}>
          {t.attribution}: {sura.attribution.title} {sura.attribution.version},{" "}
          <a href={sura.attribution.url} target="_blank" rel="noreferrer">
            Tanzil Project (tanzil.net)
          </a>
          , {sura.attribution.license}, {t.unchanged}.
        </footer>
      )}
    </>
  );
}
