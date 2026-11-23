import { SiteShell } from "@/shared/layout/site-shell";

export default function SiraLayout({ children }: LayoutProps<"/sira">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
