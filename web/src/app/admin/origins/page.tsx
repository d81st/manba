import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listParallelsForAdmin } from "@/lib/parallels";
import { StatusBadge } from "../status-badge";

const messages = getMessages();
const t = messages.admin.origins;
const o = messages.origins;

export const metadata: Metadata = { title: t.title };

export default function OriginsAdminPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <Button asChild size="sm">
          <Link href="/admin/origins/new" className="no-underline">
            <Plus />
            {t.add}
          </Link>
        </Button>
      </div>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <p className="mt-2 text-sm">
        <Link href="/origins?drafts=1">{t.preview}</Link>
      </p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <List />
      </Suspense>
    </Page>
  );
}

async function List() {
  await connection();
  await requireSession();
  const parallels = await listParallelsForAdmin();
  if (parallels.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return (
    <Table className="mt-6">
      <TableHeader>
        <TableRow>
          <TableHead>{t.titleField}</TableHead>
          <TableHead className="w-44">{t.tradition}</TableHead>
          <TableHead className="w-32">{t.degree}</TableHead>
          <TableHead className="w-32">{t.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parallels.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <Link href={`/admin/origins/${p.id}`}>{p.title}</Link>
              <span className="block text-xs text-muted-foreground">
                {p.islam} · {p.external}
              </span>
            </TableCell>
            <TableCell>{o.traditions[p.tradition as keyof typeof o.traditions]}</TableCell>
            <TableCell>{o.degrees[p.degree as keyof typeof o.degrees]}</TableCell>
            <TableCell>
              <StatusBadge status={p.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
