import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listTermsForAdmin } from "@/lib/glossary";
import { TERM_STATUSES } from "@/lib/glossary-input";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../status-badge";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.terms.title };

export default function TermsPage({ searchParams }: PageProps<"/admin/terms">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {t.title}</Link>
      </nav>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.terms.title}</h1>
        <Button asChild>
          <Link href="/admin/terms/new" className="no-underline">
            <Plus />
            {t.terms.add}
          </Link>
        </Button>
      </div>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <TermsTable searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function TermsTable({ searchParams }: { searchParams: PageProps<"/admin/terms">["searchParams"] }) {
  await connection();
  await requireSession();
  const raw = (await searchParams).status;
  const status = TERM_STATUSES.find((s) => s === raw);
  const terms = await listTermsForAdmin(status);

  const filters: { key?: string; label: string }[] = [
    { label: t.terms.all },
    ...TERM_STATUSES.map((key) => ({ key, label: t.statuses[key] })),
  ];

  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.key ? `/admin/terms?status=${filter.key}` : "/admin/terms"}
            className={cn(
              "rounded-full border px-3 py-1 no-underline",
              filter.key === status ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      {terms.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.terms.empty}</p>
      ) : (
        <div className="mt-4 rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.terms.columns.term}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.terms.columns.arabic}</TableHead>
                <TableHead>{t.terms.columns.status}</TableHead>
                <TableHead className="hidden md:table-cell">{t.terms.columns.updated}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell>
                    <Link href={`/admin/terms/${term.id}`} className="font-medium">
                      {term.translation}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {term.transliteration}
                      {term.isBasic && (
                        <Badge variant="secondary" className="ms-2">
                          {t.terms.basic} · {term.basicOrder}
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="ar text-lg" lang="ar">
                      {term.arabic}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={term.status} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {new Date(term.updatedAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                    <span className="block">{term.updatedBy}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
