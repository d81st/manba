import type { Metadata } from "next";
import { Suspense } from "react";
import { BookmarkButton, ReadingTracker } from "@/modules/bookmarks";
import { ReportButton } from "@/modules/reports";
import { defaultLocale, getMessages } from "@/shared/i18n";
// Interface font served from our own server (OFL), with Cyrillic.
import "@fontsource-variable/inter";
import "./globals.css";

const t = getMessages();

export const metadata: Metadata = {
  title: { default: t.appName, template: `%s · ${t.appName}` },
  description: t.appTagline,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} dir="ltr">
      <body>
        {children}
        {/* On every page: "add a bookmark", "report a mistake" and the memory of
            "continue reading". They read the address, so they wait in Suspense. */}
        <Suspense fallback={null}>
          <BookmarkButton />
          <ReportButton />
          <ReadingTracker />
        </Suspense>
      </body>
    </html>
  );
}
