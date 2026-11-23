import { SiteShell } from "@/shared/layout/site-shell";

export default function QuranTextLayout({
  children,
}: LayoutProps<"/quran-text">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
