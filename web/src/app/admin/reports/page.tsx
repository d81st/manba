import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { REPORT_STATUSES } from "@/modules/reports";
import { listReports, setReportStatusAction } from "@/modules/reports/server";
import { requireAdmin } from "@/shared/auth/auth";
import { safeNext } from "@/shared/auth/safe-next";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/utils";

const messages = getMessages();
const t = messages.admin.reports;

export const metadata: Metadata = { title: t.title };

// What readers wrote about mistakes on the pages ("report a mistake", migration 051).
export default function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Reports searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Reports({ searchParams }: Pick<PageProps<"/admin/reports">, "searchParams">) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const status = REPORT_STATUSES.find((s) => s === params.status) ?? "new";
  const reports = await listReports(status);
  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {REPORT_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "new" ? "/admin/reports" : `/admin/reports?status=${s}`}
            className={cn(
              "rounded-full border px-3 py-1 no-underline",
              status === s ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
            )}
          >
            {t.statuses[s]}
          </Link>
        ))}
      </nav>
      {reports.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
              <p className="text-xs text-muted-foreground">
                {r.createdAt} UTC · {t.from} {r.createdBy}
                {r.doneBy && ` · ${t.doneBy} ${r.doneBy}`}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{r.message}</p>
              {r.quote && (
                <blockquote className="mt-2 rounded-md border-s-2 border-primary bg-muted/40 px-3 py-1.5 text-sm" dir="auto">
                  <span className="text-muted-foreground">{t.quote}: </span>
                  {r.quote}
                </blockquote>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {/* The page was written by a reader: only a path of this site becomes a link. */}
                <Link href={safeNext(r.page)} className="break-all">
                  {t.open}: <bdi dir="ltr">{decodeSafe(r.page)}</bdi>
                </Link>
                <form action={setReportStatusAction} className="ms-auto">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={r.status === "new" ? "done" : "new"} />
                  <Button type="submit" size="sm" variant={r.status === "new" ? "default" : "outline"}>
                    {r.status === "new" ? t.markDone : t.markNew}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function decodeSafe(page: string) {
  try {
    return decodeURI(page);
  } catch {
    return page;
  }
}
