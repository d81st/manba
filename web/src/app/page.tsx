import {
  BookA,
  BookOpen,
  FlaskConical,
  History,
  Landmark,
  Library,
  ListChecks,
  type LucideIcon,
  Map,
  MessageCircleQuestion,
  Network,
  Orbit,
  Scale,
  ScrollText,
  SearchX,
  SquareLibrary,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { Page } from "@/shared/layout/page";
import { SiteHeader } from "@/shared/layout/site-header";
import { Badge } from "@/shared/ui/badge";
import { getMessages, type Messages } from "@/shared/i18n";
import { cn } from "@/shared/ui/utils";

const t = getMessages();

type SectionKey = keyof Messages["home"]["sections"];

const ICONS: Record<SectionKey, LucideIcon> = {
  knowledgeMap: Waypoints,
  galaxy: Orbit,
  library: BookOpen,
  encyclopedia: Library,
  quranMap: Map,
  glossary: BookA,
  sira: ScrollText,
  cities: Landmark,
  hardTopics: Scale,
  quranText: SquareLibrary,
  origins: Network,
  science: FlaskConical,
  timeline: History,
  tests: ListChecks,
  assistant: MessageCircleQuestion,
  notFound: SearchX,
};

// Sections that already have pages.
const LINKS: Partial<Record<SectionKey, string>> = {
  knowledgeMap: "/knowledge",
  galaxy: "/galaxy",
  library: "/library",
  quranMap: "/quran/map",
  glossary: "/glossary",
  encyclopedia: "/topics",
  hardTopics: "/topics?category=hard",
  quranText: "/quran-text",
  sira: "/sira",
  cities: "/cities",
  origins: "/origins",
  science: "/science",
  timeline: "/history",
  tests: "/tests",
  assistant: "/assistant",
  notFound: "/not-found-in-sources",
};

export default function Home() {
  const sections = Object.entries(t.home.sections) as [SectionKey, string][];

  return (
    <>
      <SiteHeader />
      <Page>
        <h1 className="mt-8 mb-4 text-xl font-semibold">{t.home.sectionsTitle}</h1>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(([key, name]) => {
            const Icon = ICONS[key];
            const href = LINKS[key];
            const body = (
              <>
                <Icon className={cn("size-5 shrink-0", href ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1">{name}</span>
                {href ? (
                  <Badge>{t.home.open}</Badge>
                ) : (
                  <Badge variant="secondary">{t.home.soon}</Badge>
                )}
              </>
            );
            const box = "flex h-full items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm";
            return (
              <li key={key}>
                {href ? (
                  <Link
                    href={href}
                    className={cn(box, "no-underline transition-colors hover:border-primary hover:bg-accent")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={cn(box, "text-muted-foreground")}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Page>
    </>
  );
}
