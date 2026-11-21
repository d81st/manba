import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { positiveId } from "@/modules/debates";
import { DebateView } from "@/modules/debates/server";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";

const t = getMessages().debates;

export function generateMetadata(): Metadata {
  return { title: t.title };
}

export default function DebatePage({ params }: PageProps<"/debates/[id]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">…</p>}>
        <Load params={params} />
      </Suspense>
    </Page>
  );
}

async function Load({ params }: { params: PageProps<"/debates/[id]">["params"] }) {
  const id = positiveId((await params).id);
  if (!id) notFound();
  return <DebateView id={id} />;
}
