import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listSides } from "@/lib/topics";
import { SideForm } from "./side-form";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.sides.title };

export default function SidesPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {t.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.sides.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.sides.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Sides />
      </Suspense>
    </Page>
  );
}

async function Sides() {
  await connection();
  await requireSession();
  const sides = await listSides();
  const nextPosition = Math.max(0, ...sides.map((s) => s.position)) + 1;
  return (
    <div className="mt-6 space-y-3">
      {sides.map((side) => (
        <SideForm key={`${side.id}-${side.title}-${side.slug}-${side.position}`} side={side} nextPosition={nextPosition} t={t.sides} />
      ))}
      <SideForm key={`new-${sides.length}`} side={null} nextPosition={nextPosition} t={t.sides} />
    </div>
  );
}
