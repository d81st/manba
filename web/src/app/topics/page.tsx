import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listPublishedTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

const messages = getMessages();
const t = messages.topics;

export const metadata: Metadata = { title: t.title };

export default function TopicsPage({ searchParams }: PageProps<"/topics">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Topics searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Topics({ searchParams }: { searchParams: PageProps<"/topics">["searchParams"] }) {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const { category } = await searchParams;
  const only =
    category === "hard" || category === "quran_text" || category === "sira" || category === "cities" ? category : null;
  const topics = (await listPublishedTopics()).filter((topic) => !only || topic.category === only);

  const filters = [
    { href: "/topics", label: t.allCategories, active: !only },
    { href: "/topics?category=hard", label: t.hardOnly, active: only === "hard" },
    { href: "/topics?category=quran_text", label: t.quranTextOnly, active: only === "quran_text" },
    { href: "/topics?category=sira", label: t.siraOnly, active: only === "sira" },
    { href: "/topics?category=cities", label: t.citiesOnly, active: only === "cities" },
  ];

  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {filters.map((filter) => (
          <Link
            key={filter.href}
            href={filter.href}
            className={cn(
              "rounded-full border px-3 py-1 no-underline",
              filter.active ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      {topics.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/topics/${topic.slug}`}
                className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {topic.title}
                  {topic.category === "hard" && <Badge variant="secondary">{t.hardBadge}</Badge>}
                  {topic.category === "quran_text" && <Badge variant="outline">{t.quranTextBadge}</Badge>}
                  {topic.category === "sira" && <Badge variant="outline">{t.siraBadge}</Badge>}
                  {topic.category === "cities" && <Badge variant="outline">{t.citiesBadge}</Badge>}
                </span>
                <span className="text-sm text-muted-foreground">{topic.question}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
