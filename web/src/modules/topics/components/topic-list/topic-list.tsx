import Link from "next/link";
import { getMessages } from "@/shared/i18n";
import { cn } from "@/shared/ui/utils";
import type { ListFilter } from "../../topic.constants";
import type { TopicSummary } from "../../topic.types";
import { TopicBadge } from "../topic-badges";

const t = getMessages().topics;

const FILTERS: { key: ListFilter | null; label: string }[] = [
  { key: null, label: t.allCategories },
  { key: "hard", label: t.hardOnly },
  { key: "quran_text", label: t.quranTextOnly },
  { key: "sira", label: t.siraOnly },
  { key: "cities", label: t.citiesOnly },
  { key: "testimony", label: t.testimonyOnly },
  { key: "science", label: t.scienceOnly },
];

// The public list of topics with the category filters above it.
export function TopicList({ topics, active }: { topics: TopicSummary[]; active: ListFilter | null }) {
  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((filter) => {
          const href = filter.key ? `/topics?category=${filter.key}` : "/topics";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 no-underline",
                filter.key === active ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
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
                  <TopicBadge category={topic.category} />
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
