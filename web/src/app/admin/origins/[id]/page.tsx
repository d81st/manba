import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { PreviewLink } from "../../preview-link";
import { StatusBadge } from "../../status-badge";
import { getParallelForEdit } from "@/modules/origins/server";
import { ParallelForm } from "@/modules/origins";

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
  await requireAdmin();
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
        <PreviewLink href={`/origins/${parallel.slug}`} className="inline-flex items-center gap-1 text-sm">
          <ExternalLink className="size-4" />
          {messages.admin.origins.preview}
        </PreviewLink>
      </div>
      <ParallelForm key={id} id={id} initial={initial} saved={saved} messages={messages} />
    </>
  );
}
