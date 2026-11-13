import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { KEEP_DAYS } from "@/modules/monitoring";
import { clearErrorsAction, listErrorGroups } from "@/modules/monitoring/server";
import { requireAdmin } from "@/shared/auth/auth";
import { getMessages, plural } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";
import { Button } from "@/shared/ui/button";

const messages = getMessages();
const t = messages.admin.siteErrors;

export const metadata: Metadata = { title: t.title };

// The journal of site errors (migration 059): what failed on the server and
// in the readers' browsers, grouped by place and message.
export default function AdminErrorsPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro.replace("{days}", String(KEEP_DAYS))}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Errors />
      </Suspense>
    </Page>
  );
}

async function Errors() {
  await connection();
  await requireAdmin();
  const groups = await listErrorGroups();
  if (groups.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return (
    <>
      <form action={clearErrorsAction} className="mt-4">
        <Button type="submit" size="sm" variant="outline">
          {t.clear}
        </Button>
      </form>
      <ul className="mt-4 space-y-3">
        {groups.map((g) => (
          <li key={`${g.kind}|${g.route}|${g.message}`} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-0.5">{t.kinds[g.kind]}</span> {plural(g.count, t.times)} · {t.first} {g.first} · {t.last} {g.last} UTC
            </p>
            <p className="mt-2 break-words font-medium" dir="auto">
              {g.message}
            </p>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {g.route && <bdi dir="ltr">{g.route}</bdi>}
              {g.path && (
                <>
                  {g.route && " · "}
                  {t.page}: <bdi dir="ltr">{g.path}</bdi>
                </>
              )}
              {g.digest && ` · ${t.code}: ${g.digest}`}
            </p>
            {g.stack && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-muted-foreground">{t.stack}</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-muted/40 p-2 text-xs" dir="ltr">
                  {g.stack}
                </pre>
              </details>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
