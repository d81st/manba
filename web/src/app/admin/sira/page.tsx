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
import { getSiraForAdmin } from "@/lib/sira-events";
import { StatusBadge } from "../status-badge";

const messages = getMessages();
const t = messages.admin.sira;

export const metadata: Metadata = { title: t.title };

export default function SiraAdminPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
        <Link href="/sira/timeline?drafts=1">{messages.sira.views.timeline}</Link>
        <Link href="/sira/map?drafts=1">{messages.sira.views.map}</Link>
        <Link href="/sira/people?drafts=1">{messages.sira.views.people}</Link>
        <span className="text-muted-foreground">— {t.preview}</span>
      </p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Lists />
      </Suspense>
    </Page>
  );
}

function Heading({ title, href, add }: { title: string; href: string; add: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button asChild size="sm">
        <Link href={href} className="no-underline">
          <Plus />
          {add}
        </Link>
      </Button>
    </div>
  );
}

async function Lists() {
  await connection();
  await requireSession();
  const data = await getSiraForAdmin();
  const relationCount = (slug: string) => data.relations.filter((r) => r.a === slug || r.b === slug).length;
  const eventsAt = (slug: string) => data.events.filter((e) => e.place === slug).length;
  return (
    <>
      <Heading title={t.events} href="/admin/sira/events/new" add={t.addEvent} />
      <Table className="mt-3">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t.position}</TableHead>
            <TableHead>{t.nameField}</TableHead>
            <TableHead className="w-16 text-end">{t.dates}</TableHead>
            <TableHead className="w-32">{t.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.events.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="tabular-nums text-muted-foreground">{e.position}</TableCell>
              <TableCell>
                <Link href={`/admin/sira/events/${e.id}`}>{e.title}</Link>
              </TableCell>
              <TableCell className="text-end tabular-nums">{e.dates.length}</TableCell>
              <TableCell>
                <StatusBadge status={e.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Heading title={t.people} href="/admin/sira/people/new" add={t.addPerson} />
      <Table className="mt-3">
        <TableHeader>
          <TableRow>
            <TableHead>{t.name}</TableHead>
            <TableHead className="w-16 text-end">{t.relations}</TableHead>
            <TableHead className="w-32">{t.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.people.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`/admin/sira/people/${p.id}`}>{p.name}</Link>
              </TableCell>
              <TableCell className="text-end tabular-nums">{relationCount(p.slug)}</TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Heading title={t.places} href="/admin/sira/places/new" add={t.addPlace} />
      <Table className="mt-3">
        <TableHeader>
          <TableRow>
            <TableHead>{t.name}</TableHead>
            <TableHead className="w-40">{t.coords}</TableHead>
            <TableHead className="w-16 text-end">{t.events}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.places.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`/admin/sira/places/${p.id}`}>{p.name}</Link>
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {p.lat !== null && p.lon !== null ? `${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}` : t.noCoords}
              </TableCell>
              <TableCell className="text-end tabular-nums">{eventsAt(p.slug)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
