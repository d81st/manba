import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { ParallelArticle } from "@/modules/origins";
import { getParallel } from "@/modules/origins/server";
import { isPreview } from "@/lib/preview";
import { PreviewNote } from "../../sira/shared";

const messages = getMessages();
const t = messages.origins;

export const metadata: Metadata = { title: t.title };

// One link: both texts side by side, its kind, degree and basis, and both
// readings of the likeness with their sources. The site draws no conclusion.
export default function ParallelPage({ params, searchParams }: PageProps<"/origins/[slug]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Parallel params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Parallel({ params, searchParams }: Pick<PageProps<"/origins/[slug]">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  const preview = await isPreview(await searchParams);
  if (!/^[a-z][a-z0-9-]*$/.test(slug) || !isDatabaseConfigured()) notFound();
  const p = await getParallel(slug, preview);
  if (!p) notFound();
  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href={preview ? "/origins?drafts=1" : "/origins"}>← {t.title}</Link>
      </nav>
      <PreviewNote preview={preview && p.status !== "published"} />
      <ParallelArticle p={p} />
    </>
  );
}
