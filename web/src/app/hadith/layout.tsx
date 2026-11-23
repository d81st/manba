import { SiteShell } from "@/shared/layout/site-shell";

export default function HadithLayout({ children }: LayoutProps<"/hadith">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
