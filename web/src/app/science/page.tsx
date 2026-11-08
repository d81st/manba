import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { Badge } from "@/shared/ui/badge";
import { getMessages } from "@/shared/i18n";
import { isDatabaseConfigured } from "@/shared/db";
import type { TopicSummary } from "@/modules/topics";
import { listPublishedTopics, listTopicsForAdmin } from "@/modules/topics/server";
import { isPreview } from "@/shared/auth/preview";
import { PreviewBar } from "@/shared/layout/preview";

const messages = getMessages();
const t = messages.science;

export const metadata: Metadata = { title: t.title };

// The books of the section in the library (migration 021).
const BOOKS = [
  "uyun_anba",
  "ikhbar_ulama",
  "sharh_isharat_tusi",
  "tahafut_ghazali",
  "munqidh_ghazali",
  "jawahir_quran_ghazali",
  "ighathat_lahfan",
  "muwafaqat_shatibi",
  "itqan_suyuti",
];

// «Ислам и наука» (docs/PLAN.md): the historical contribution (topics of the
// category science) and the claims that texts foretell discoveries
// (science_claims), never mixed (migration 021).
export default function SciencePage({ searchParams }: PageProps<"/science">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Science searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Science({ searchParams }: Pick<PageProps<"/science">, "searchParams">) {
  await connection();
  const preview = await isPreview(await searchParams);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const topics = (preview ? await listTopicsForAdmin() : await listPublishedTopics())
    .filter((topic) => topic.status !== "retired")
    .sort((a, b) => a.id - b.id);
  const history = topics.filter((topic) => topic.category === "science");
  const claims = topics.filter((topic) => topic.category === "science_claims");

  return (
    <>
      <PreviewBar href="/science" preview={preview} />
      <Part title={t.history} hint={t.historyHint} topics={history} preview={preview} />
      <Part title={t.claims} hint={t.claimsHint} topics={claims} preview={preview} />
      <h2 className="mt-10 mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.books}</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {BOOKS.map((id) => (
          <li key={id}>
            <Link href={`/library/${id}`}>{bookTitle(id)}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

const TITLES: Record<string, string> = {
  uyun_anba: "Ибн Аби Усайбиа, «Уюн аль-анба»",
  ikhbar_ulama: "аль-Кифти, «Ихбар аль-уляма»",
  sharh_isharat_tusi: "ат-Туси, комментарий к «аль-Ишарат»",
  tahafut_ghazali: "аль-Газали, «Тахафут аль-фалясифа»",
  munqidh_ghazali: "аль-Газали, «аль-Мункыз»",
  jawahir_quran_ghazali: "аль-Газали, «Джавахир аль-Куран»",
  ighathat_lahfan: "Ибн аль-Каййим, «Игасат аль-ляхфан»",
  muwafaqat_shatibi: "аш-Шатиби, «аль-Мувафакат»",
  itqan_suyuti: "ас-Суюти, «аль-Иткан»",
};
const bookTitle = (id: string) => TITLES[id] ?? id;

function Part({
  title,
  hint,
  topics,
  preview,
}: {
  title: string;
  hint: string;
  topics: TopicSummary[];
  preview: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{hint}</p>
      {topics.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t.empty} <Link href="/admin/topics">{t.drafts}</Link>
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={preview ? `/topics/${topic.slug}?drafts=1` : `/topics/${topic.slug}`}
                className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="font-medium">{topic.title}</span>
                <span className="text-sm text-muted-foreground">{topic.question}</span>
                {topic.status !== "published" && (
                  <span>
                    <Badge variant="outline">
                      {messages.admin.statuses[topic.status as keyof typeof messages.admin.statuses] ?? topic.status}
                    </Badge>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
