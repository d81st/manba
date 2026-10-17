import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listSuras } from "@/lib/quran";
import { SearchForm } from "./search-form";
import { SuraMeta } from "./sura-meta";
import styles from "./quran.module.css";

const t = getMessages().quran;

export const metadata: Metadata = { title: t.title };

export default function QuranPage() {
  return (
    <main className="container">
      <nav className={styles.crumbs}>
        <Link href="/quran/map">{t.map.title} →</Link>
      </nav>
      <h1 className={styles.title}>{t.title}</h1>
      <p className="muted">{t.subtitle}</p>
      <SearchForm />
      <p className="muted">{t.placeNote}</p>
      <Suspense fallback={<p className="muted">{t.loading}</p>}>
        <SuraList />
      </Suspense>
    </main>
  );
}

async function SuraList() {
  // Read the database at request time only, never during the build.
  await connection();
  if (!isDatabaseConfigured()) return <p className="error">{t.noDatabase}</p>;
  const suras = await listSuras();

  return (
    <ol className={styles.suras}>
      {suras.map((sura) => (
        <li key={sura.number}>
          <Link href={`/quran/${sura.number}`} className={`card ${styles.sura}`}>
            <span className={styles.number}>{sura.number}</span>
            <span className={styles.names}>
              <span>{sura.names.translit}</span>
              <SuraMeta sura={sura} showBasis={false} />
            </span>
            <span className={`quran ${styles.arabicName}`} lang="ar" dir="rtl">
              {sura.names.ar}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
