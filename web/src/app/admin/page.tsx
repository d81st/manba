import { BookA, CalendarRange, History, Link2, ListChecks, type LucideIcon, MessageCircleQuestion, Network, Scale, SearchX, UserCog, Users, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.title };

const SECTIONS: { href: string; icon: LucideIcon; title: string; hint: string }[] = [
  { href: "/admin/terms", icon: BookA, title: t.sections.terms, hint: t.sections.termsHint },
  { href: "/admin/topics", icon: Scale, title: t.sections.topics, hint: t.sections.topicsHint },
  { href: "/admin/sira", icon: CalendarRange, title: t.sections.sira, hint: t.sections.siraHint },
  { href: "/admin/origins", icon: Network, title: t.sections.origins, hint: t.sections.originsHint },
  { href: "/admin/history", icon: History, title: t.sections.history, hint: t.sections.historyHint },
  { href: "/admin/tests", icon: ListChecks, title: t.sections.tests, hint: t.sections.testsHint },
  { href: "/admin/findings", icon: SearchX, title: t.sections.findings, hint: t.sections.findingsHint },
  { href: "/admin/assistant", icon: MessageCircleQuestion, title: t.sections.assistant, hint: t.sections.assistantHint },
  { href: "/admin/sides", icon: Users, title: t.sections.sides, hint: t.sections.sidesHint },
  { href: "/admin/links", icon: Link2, title: t.sections.links, hint: t.sections.linksHint },
  { href: "/admin/videos", icon: Video, title: t.sections.videos, hint: t.sections.videosHint },
  { href: "/admin/users", icon: UserCog, title: t.sections.users, hint: t.sections.usersHint },
];

export default function AdminPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, title, hint }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full gap-3 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <Icon className="size-5 shrink-0 text-primary" />
              <span>
                <span className="block font-medium">{title}</span>
                <span className="text-sm text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
