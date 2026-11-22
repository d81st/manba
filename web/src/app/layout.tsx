import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { BookmarkButton, ReadingTracker } from "@/modules/bookmarks";
import { ReportButton } from "@/modules/reports";
import { getMessages } from "@/shared/i18n";
import { LOCALE_COOKIE } from "@/shared/i18n/locale";
import { requestLocale } from "@/shared/i18n/locale-reader.server";
import { DocumentLang } from "@/shared/layout/document-lang";
import { QuoteHighlight } from "@/shared/content/quote-highlight";
// Interface font served from our own server (OFL), with Cyrillic.
import "@fontsource-variable/inter";
import "./globals.css";

// Runs while the browser parses the shell, before client components read the language.
const localeBoot = `(function(){try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=(ru|en)(?:;|$)/);if(m)document.documentElement.lang=m[1];}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  await cookies();
  const t = getMessages();
  return {
    title: { default: t.appName, template: `%s · ${t.appName}` },
    description: t.appTagline,
    robots: { index: false, follow: false },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" dir="ltr" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: localeBoot }} />
        {/* The shell stays language-neutral. The page itself waits for the
            language cookie, so the words are the ones of this request. */}
        <Suspense fallback={null}>
          <Localized>{children}</Localized>
        </Suspense>
      </body>
    </html>
  );
}

async function Localized({ children }: { children: ReactNode }) {
  const locale = await requestLocale();
  return (
    <div lang={locale} data-locale={locale}>
      <DocumentLang locale={locale} />
      {children}
      <Suspense fallback={null}>
        <BookmarkButton />
        <ReportButton />
        <ReadingTracker />
        <QuoteHighlight />
      </Suspense>
    </div>
  );
}
