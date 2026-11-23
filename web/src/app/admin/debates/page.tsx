import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listDebateQueue } from "@/modules/debates/server";
import { requireAdmin } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";
import { Badge } from "@/shared/ui/badge";
import { Lead } from "@/shared/ui/lead";

const messages = getMessages();
const t = messages.admin.debates;
const debates = messages.debates;

export function generateMetadata(): Metadata {
  return { title: t.title };
}

export default function AdminDebatesPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <Lead className="mt-1">{t.intro}</Lead>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Queue />
      </Suspense>
    </Page>
  );
}

async function Queue() {
  await connection();
  await requireAdmin();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const rows = await listDebateQueue();
  if (rows.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return (
    <ul className="mt-6 space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="rounded-xl border bg-card p-4">
          <Link href={`/debates/${row.id}`} className="font-medium break-words" dir="auto">
            {row.question}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{debates.statuses[row.status]}</Badge>
            <span>
              {row.createdBy} · {row.partner} · {t.cited.replace("{cited}", String(row.cited)).replace("{checked}", String(row.checked))}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
