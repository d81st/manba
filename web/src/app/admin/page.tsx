import { BookA, CalendarRange, Link2, type LucideIcon, Network, Scale, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.title };

const SECTIONS: { href: string; icon: LucideIcon; title: string; hint: string }[] = [
  { href: "/admin/terms", icon: BookA, title: t.sections.terms, hint: t.sections.termsHint },
  { href: "/admin/topics", icon: Scale, title: t.sections.topics, hint: t.sections.topicsHint },
  { href: "/admin/sira", icon: CalendarRange, title: t.sections.sira, hint: t.sections.siraHint },
  { href: "/admin/origins", icon: Network, title: t.sections.origins, hint: t.sections.originsHint },
  { href: "/admin/sides", icon: Users, title: t.sections.sides, hint: t.sections.sidesHint },
  { href: "/admin/links", icon: Link2, title: t.sections.links, hint: t.sections.linksHint },
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
