import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getCoMentions, getSiraData } from "@/lib/sira-events";
import { forceLayout } from "@/lib/sira-graph";
import { isPreview, pageOf, PreviewNote, SiraNav } from "../shared";
import { PeopleGraph } from "./people-graph";

const messages = getMessages();
const t = messages.sira;

export const metadata: Metadata = { title: t.peoplePage.title };

export default function PeoplePage({ searchParams }: PageProps<"/sira/people">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <People searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

const GRAPH = { width: 900, height: 640 };

async function People({ searchParams }: Pick<PageProps<"/sira/people">, "searchParams">) {
  await connection();
  const preview = isPreview(await searchParams);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const [{ people, relations }, together] = await Promise.all([getSiraData(preview), getCoMentions(preview)]);
  const slugs = new Set(people.map((p) => p.slug));
  const pairs = together.pairs.filter((p) => slugs.has(p.a) && slugs.has(p.b));
  const top = Math.max(1, ...pairs.map((p) => p.count));
  const positions = forceLayout(
    people.map((p) => p.slug),
    [
      ...relations.map((r) => ({ a: r.a, b: r.b, strength: 1 })),
      ...pairs.map((p) => ({ a: p.a, b: p.b, strength: (0.4 * p.count) / top })),
    ],
    GRAPH.width,
    GRAPH.height,
    { x: 90, y: 40 },
  );

  return (
    <>
      <SiraNav path="/sira/people" preview={preview} />
      <PreviewNote preview={preview} />
      <h1 className="mt-4 text-2xl font-semibold">{t.peoplePage.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.peoplePage.intro}</p>
      {people.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.empty}</p>
      ) : (
        <PeopleGraph
          size={GRAPH}
          positions={positions}
          people={people.map((p) => ({
            slug: p.slug,
            name: p.name,
            nameAr: p.nameAr,
            draft: p.status !== "published",
            card: p.topic && (p.topic.published || preview) ? `/topics/${p.topic.slug}` : null,
            mentions: together.units[p.slug] ?? null,
          }))}
          relations={relations.map((r) => {
            const page = pageOf(r.address);
            return { a: r.a, b: r.b, kind: r.kind, quote: r.quote, note: r.note, href: page.href, ref: page.label, draft: r.status !== "published" };
          })}
          pairs={pairs}
          t={{ ...t.peoplePage, relationKinds: t.relationKinds, draft: t.draft }}
        />
      )}
    </>
  );
}
