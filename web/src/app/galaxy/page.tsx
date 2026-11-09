import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { GalaxyView } from "@/modules/galaxy";
import { getGalaxy } from "@/modules/galaxy/server";
import { isDatabaseConfigured } from "@/shared/db";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";

const messages = getMessages();
const t = messages.galaxy;

export const metadata: Metadata = { title: t.title };

export default function GalaxyPage({ searchParams }: PageProps<"/galaxy">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{t.loading}</p>}>
        <GalaxyContent searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function GalaxyContent({ searchParams }: { searchParams: PageProps<"/galaxy">["searchParams"] }) {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const [{ view }, data] = await Promise.all([searchParams, getGalaxy()]);
  if (data.items.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return <GalaxyView data={data} initialView={view === "3d" ? "3d" : "2d"} />;
}
