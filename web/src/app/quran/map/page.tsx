import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getMapData } from "@/lib/quran";
import { QuranMap } from "./quran-map";
import styles from "../quran.module.css";

const messages = getMessages();
const t = messages.quran;

export const metadata: Metadata = { title: t.map.title };

export default function MapPage() {
  return (
    <main className="container">
      <nav className={styles.crumbs}>
        <Link href="/quran">← {t.map.listAlternative}</Link>
        <Link href="/quran/search">{t.search.link}</Link>
      </nav>
      <h1 className={styles.title}>{t.map.title}</h1>
      <p className="muted">{t.map.intro}</p>
      <Suspense fallback={<p className="muted">{t.loading}</p>}>
        <MapData />
      </Suspense>
    </main>
  );
}

async function MapData() {
  await connection();
  if (!isDatabaseConfigured()) return <p className="error">{t.noDatabase}</p>;
  const suras = await getMapData();
  return <QuranMap suras={suras} t={t} />;
}
