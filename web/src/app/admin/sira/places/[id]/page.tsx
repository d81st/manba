import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { getPlaceForEdit } from "@/lib/sira-events";
import { PlaceForm } from "../../place-form";

const messages = getMessages();
const t = messages.admin.sira;

export const metadata: Metadata = { title: t.places };

export default function EditPlacePage({ params, searchParams }: PageProps<"/admin/sira/places/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/sira">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditPlace params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditPlace({ params, searchParams }: Pick<PageProps<"/admin/sira/places/[id]">, "params" | "searchParams">) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const place = await getPlaceForEdit(Number(raw));
  if (!place) notFound();
  const saved = (await searchParams).saved === "1";
  const { id, ...initial } = place;
  return (
    <>
      <h1 className="mt-3 text-2xl font-semibold">{place.name}</h1>
      <PlaceForm key={id} id={id} initial={initial} saved={saved} messages={messages} />
    </>
  );
}
