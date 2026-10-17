import type { Metadata } from "next";
import { defaultLocale, getMessages } from "@/i18n";
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
      <body>{children}</body>
    </html>
  );
}
