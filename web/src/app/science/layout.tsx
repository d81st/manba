import { SiteShell } from "@/shared/layout/site-shell";

export default function ScienceLayout({ children }: LayoutProps<"/science">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
