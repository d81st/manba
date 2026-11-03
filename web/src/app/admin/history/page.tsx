import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { ceLabel } from "@/lib/history-input";
import { listHistoryForAdmin } from "@/lib/history";
import { PreviewLink } from "../preview-link";
import { StatusBadge } from "../status-badge";

const messages = getMessages();
const t = messages.admin.history;

export const metadata: Metadata = { title: t.title };

export default function AdminHistoryPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/history/new">+ {t.add}</Link>
        <PreviewLink href="/history">{t.preview}</PreviewLink>
      </div>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Events />
      </Suspense>
    </Page>
  );
}

async function Events() {
  await connection();
  await requireSession();
  const events = await listHistoryForAdmin();
  if (events.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return (
    <ul className="mt-6 divide-y rounded-xl border bg-card">
      {events.map((e) => {
        const year = e.dates.find((d) => d.yearAh !== null || d.yearCe !== null);
        return (
          <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Link href={`/admin/history/${e.id}`} className="font-medium">
              {e.title}
            </Link>
            <Badge variant="outline">{messages.history.layers[e.layer as keyof typeof messages.history.layers] ?? e.layer}</Badge>
            <StatusBadge status={e.status} />
            <span className="ms-auto text-sm tabular-nums text-muted-foreground">
              {year ? (year.yearCe ?? `${year.yearAh} ${messages.history.ah} ≈ ${ceLabel(year.yearAh!)}`) : "—"} · {t.dates}: {e.dates.length}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
