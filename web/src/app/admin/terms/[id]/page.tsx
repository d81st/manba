import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { getTermForEdit, listTermChoices } from "@/lib/glossary";
import { StatusBadge } from "../../status-badge";
import { TermForm } from "../term-form";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.terms.editTitle };

export default function EditTermPage({ params, searchParams }: PageProps<"/admin/terms/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/terms">← {t.terms.title}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditTerm params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditTerm({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/terms/[id]">["params"];
  searchParams: PageProps<"/admin/terms/[id]">["searchParams"];
}) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const term = await getTermForEdit(Number(raw));
  if (!term) notFound();
  const choices = await listTermChoices();
  const saved = (await searchParams).saved === "1";
  const { id, relatedNames, ...initial } = term;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{term.translation}</h1>
        <span className="ar text-2xl" lang="ar">
          {term.arabic}
        </span>
        <StatusBadge status={term.status} />
        {term.status === "published" && (
          <Link href={`/glossary/${term.slug}`} className="inline-flex items-center gap-1 text-sm">
            <ExternalLink className="size-4" />
            {t.terms.view}
          </Link>
        )}
      </div>
      <TermForm
        key={`${id}-${term.status}`}
        id={id}
        initial={initial}
        choices={choices}
        relatedNames={relatedNames}
        saved={saved}
        t={t}
      />
    </>
  );
}
