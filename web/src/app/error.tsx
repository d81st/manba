"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";
import { Button } from "@/shared/ui/button";

const t = getMessages().errorPage;

// Shown when a page fails (for example, the database does not answer): a
// plain message and a way to try again. The details stay in the server log;
// the code helps to find them there.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <Page className="flex flex-col items-start gap-3 py-12">
      <TriangleAlert className="size-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground">{t.text}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => retry()}>
          {t.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href="/" className="no-underline">
            {t.home}
          </Link>
        </Button>
      </div>
      {digest && (
        <p className="text-xs text-muted-foreground">
          {t.code}: {digest}
        </p>
      )}
    </Page>
  );
}
