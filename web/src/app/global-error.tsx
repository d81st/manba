"use client";

import { ErrorReporter } from "@/modules/monitoring";
import { defaultLocale, getMessages } from "@/shared/i18n";
import "./globals.css";

const t = getMessages().errorPage;

// The last resort: the root layout itself failed. Renders its own document.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang={defaultLocale} dir="ltr">
      <body>
        <title>{t.title}</title>
        <main className="mx-auto flex max-w-xl flex-col items-start gap-3 px-4 py-12">
          <ErrorReporter error={error} />
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-muted-foreground">{t.text}</p>
          <button type="button" className="rounded-md border px-3 py-1.5 text-sm" onClick={() => retry()}>
            {t.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
