import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { foundLabel, getFinding } from "@/lib/findings";
import type { FindingInput } from "@/lib/findings-input";
import { FindingForm } from "../finding-form";

const messages = getMessages();
const t = messages.admin.findings;

export const metadata: Metadata = { title: t.title };

export default function EditFindingPage({ params, searchParams }: PageProps<"/admin/findings/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/findings">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditFinding params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditFinding({ params, searchParams }: Pick<PageProps<"/admin/findings/[id]">, "params" | "searchParams">) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const finding = await getFinding(Number(raw));
  if (!finding) notFound();
  const saved = (await searchParams).saved === "1";
  const initial: FindingInput = {
    status: finding.status as FindingInput["status"],
    leadUrl: finding.leadUrl,
    leadDate: finding.leadDate,
    claimedSource: finding.claimedSource,
    claimedText: finding.claimedText,
    found: finding.foundAddress ? foundLabel(finding.foundAddress) : "",
    searched: finding.searched,
    note: finding.note,
    public: finding.public,
    reason: "",
  };
  return (
    <>
      <h1 className="mt-3 text-2xl font-semibold">{finding.claimedSource}</h1>
      <FindingForm key={`${finding.id}-${finding.status}`} id={finding.id} initial={initial} saved={saved} messages={messages} />
    </>
  );
}
