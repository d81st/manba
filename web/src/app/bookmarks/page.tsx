import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { bookmarkOwner } from "@/modules/bookmarks";
import { deleteBookmarkAction, listBookmarks } from "@/modules/bookmarks/server";
import { requireSession } from "@/shared/auth/auth";
import { safeNext } from "@/shared/auth/safe-next";
import { isDatabaseConfigured } from "@/shared/db";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";
import { Button } from "@/shared/ui/button";

const messages = getMessages();
const t = messages.bookmarks;

export const metadata: Metadata = { title: t.title };

// A reader's own bookmarks (migration 052): only theirs, never anyone else's.
export default function BookmarksPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Bookmarks />
      </Suspense>
    </Page>
  );
}

async function Bookmarks() {
  await connection();
  const session = await requireSession();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const bookmarks = await listBookmarks(bookmarkOwner(session));
  if (bookmarks.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;
  return (
    <ul className="mt-6 space-y-2">
      {bookmarks.map((b) => (
        <li key={b.id} className="flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
          <div className="min-w-0 flex-1">
            <Link href={safeNext(b.page)} className="font-medium">
              {b.title}
            </Link>
            {b.note && <p className="mt-1 text-sm">{b.note}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{b.createdAt}</p>
          </div>
          <form action={deleteBookmarkAction}>
            <input type="hidden" name="id" value={b.id} />
            <Button type="submit" size="sm" variant="outline">
              {t.remove}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
