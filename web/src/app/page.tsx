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
  Scale,
  ScrollText,
  SquareLibrary,
} from "lucide-react";
import Link from "next/link";
import { Page } from "@/components/page";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { getMessages, type Messages } from "@/i18n";
import { cn } from "@/lib/utils";

const t = getMessages();

type SectionKey = keyof Messages["home"]["sections"];

const ICONS: Record<SectionKey, LucideIcon> = {
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
};

// Sections that already have pages.
const LINKS: Partial<Record<SectionKey, string>> = {
  library: "/library",
  quranMap: "/quran/map",
  glossary: "/glossary",
  encyclopedia: "/topics",
  hardTopics: "/topics?category=hard",
  quranText: "/quran-text",
  sira: "/sira",
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
