import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { Badge } from "@/shared/ui/badge";
import { Lead } from "@/shared/ui/lead";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { listReviewQueue } from "@/modules/topics/server";
import { StatusBadge } from "../status-badge";

const t = getMessages().admin;

export function generateMetadata(): Metadata {
  return { title: t.review.title };
}

export default function ReviewPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {t.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.review.title}</h1>
      <Lead className="mt-2">{t.review.intro}</Lead>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Queue />
      </Suspense>
    </Page>
  );
}

async function Queue() {
  await connection();
  await requireAdmin();
  const rows = await listReviewQueue();
  if (rows.length === 0) return <p className="mt-6 text-muted-foreground">{t.review.empty}</p>;
  return (
    <div className="mt-6 rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.review.columns.topic}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.review.columns.status}</TableHead>
            <TableHead>{t.review.columns.progress}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-normal">
                <Link href={`/admin/review/${row.id}`} className="font-medium">
                  {row.title}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {t.categories[row.category as keyof typeof t.categories] ?? row.category}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell className="whitespace-normal">
                <span className="tabular-nums">
                  {row.progress.checked} {t.review.of} {row.progress.total}
                </span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {row.progress.changed > 0 && (
                    <Badge variant="secondary">
                      {t.review.changed}: {row.progress.changed}
                    </Badge>
                  )}
                  {row.progress.notes > 0 && (
                    <Badge variant="outline">
                      {t.review.notes}: {row.progress.notes}
                    </Badge>
                  )}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
