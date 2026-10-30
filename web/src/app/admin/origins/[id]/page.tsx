import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { getParallelForEdit } from "@/lib/parallels";
import { StatusBadge } from "../../status-badge";
import { ParallelForm } from "../parallel-form";

const messages = getMessages();
const t = messages.admin.origins;

export const metadata: Metadata = { title: t.title };

export default function EditParallelPage({ params, searchParams }: PageProps<"/admin/origins/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/origins">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditParallel params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditParallel({ params, searchParams }: Pick<PageProps<"/admin/origins/[id]">, "params" | "searchParams">) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const parallel = await getParallelForEdit(Number(raw));
  if (!parallel) notFound();
  const saved = (await searchParams).saved === "1";
  const { id, ...initial } = parallel;
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{parallel.title}</h1>
        <StatusBadge status={parallel.status} />
        <Link href={`/origins/${parallel.slug}?drafts=1`} className="inline-flex items-center gap-1 text-sm">
          <ExternalLink className="size-4" />
          {messages.admin.origins.preview}
        </Link>
      </div>
      <ParallelForm key={id} id={id} initial={initial} saved={saved} messages={messages} />
    </>
  );
}
