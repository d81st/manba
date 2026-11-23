import { SiteShell } from "@/shared/layout/site-shell";

export default function GalaxyLayout({ children }: LayoutProps<"/galaxy">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
