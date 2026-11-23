import { SiteShell } from "@/shared/layout/site-shell";

export default function DebatesLayout({ children }: LayoutProps<"/debates">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
