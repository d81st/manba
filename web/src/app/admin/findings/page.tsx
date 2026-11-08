import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { Badge } from "@/shared/ui/badge";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { cn } from "@/shared/ui/utils";
import { FINDING_STATUSES, foundLabel } from "@/modules/findings";
import { listFindings } from "@/modules/findings/server";

const messages = getMessages();
const t = messages.admin.findings;

export const metadata: Metadata = { title: t.title };

export default function AdminFindingsPage({ searchParams }: PageProps<"/admin/findings">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/findings/new">+ {t.add}</Link>
        <Link href="/not-found-in-sources">{messages.notFoundInSources.title}</Link>
      </div>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Findings searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Findings({ searchParams }: Pick<PageProps<"/admin/findings">, "searchParams">) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const status = FINDING_STATUSES.find((s) => s === params.status);
  const findings = await listFindings(status);
  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {[undefined, ...FINDING_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/findings?status=${s}` : "/admin/findings"}
            className={cn(
              "rounded-full border px-3 py-1 no-underline",
              status === s ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
            )}
          >
            {s ? t.statuses[s] : t.all}
          </Link>
        ))}
      </nav>
      {findings.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-4 divide-y rounded-xl border bg-card">
          {findings.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Link href={`/admin/findings/${f.id}`} className="font-medium">
                {f.claimedSource}
              </Link>
              <Badge variant={f.status === "not_found" ? "destructive" : f.status === "confirmed" ? "default" : "outline"}>
                {t.statuses[f.status as keyof typeof t.statuses] ?? f.status}
              </Badge>
              {f.public && <Badge variant="secondary">{t.shown}</Badge>}
              {f.foundAddress && <span className="text-sm text-muted-foreground">→ {foundLabel(f.foundAddress)}</span>}
              <span className="ms-auto text-sm text-muted-foreground">{f.updatedAt}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
