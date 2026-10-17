import type { Metadata } from "next";
import { defaultLocale, getMessages } from "@/i18n";
import { AuthHashHandler } from "./auth-hash-handler";
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
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
