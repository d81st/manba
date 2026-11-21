import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listDebates } from "@/modules/debates/server";
import { requireSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { DebateListItem } from "@/modules/debates";

const messages = getMessages();
const t = messages.debates;

export function generateMetadata(): Metadata {
  return { title: t.title };
}

export default function DebatesPage() {
  return (
    <Page>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <Button asChild>
          <Link href="/debates/new">{t.new}</Link>
        </Button>
      </div>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Lists />
      </Suspense>
    </Page>
  );
}

function DebateLinks({ items, empty }: { items: DebateListItem[]; empty: string }) {
  if (items.length === 0) return <p className="mt-2 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/debates/${item.id}`} className="break-words" dir="auto">
            {item.question}
          </Link>
          <Badge variant="secondary" className="ms-2">
            {t.statuses[item.status]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

async function Lists() {
  await connection();
  const session = await requireSession();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const { invitations, mine, published } = await listDebates(session.login);
  return (
    <div className="mt-6 space-y-6">
      <section>
        <h2 className="text-lg font-semibold">{t.invitations}</h2>
        <DebateLinks items={invitations} empty={t.empty} />
      </section>
      <section>
        <h2 className="text-lg font-semibold">{t.mine}</h2>
        <DebateLinks items={mine} empty={t.empty} />
      </section>
      <section>
        <h2 className="text-lg font-semibold">{t.published}</h2>
        <DebateLinks items={published} empty={t.noPublished} />
      </section>
    </div>
  );
}
