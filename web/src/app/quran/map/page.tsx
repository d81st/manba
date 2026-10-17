import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getMapData } from "@/lib/quran";
import { QuranNav } from "../nav";
import { QuranMap } from "./quran-map";

const t = getMessages().quran;

export const metadata: Metadata = { title: t.map.title };

export default function MapPage() {
  return (
    <Page>
      <QuranNav current="map" />
      <h1 className="mt-3 text-2xl font-semibold">{t.map.title}</h1>
      <p className="text-muted-foreground">{t.map.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{t.loading}</p>}>
        <MapData />
      </Suspense>
    </Page>
  );
}

async function MapData() {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{t.noDatabase}</p>;
  const suras = await getMapData();
  return <QuranMap suras={suras} t={t} />;
}
