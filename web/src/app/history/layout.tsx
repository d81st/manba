import { SiteShell } from "@/shared/layout/site-shell";

export default function HistoryLayout({ children }: LayoutProps<"/history">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
