import { SiteShell } from "@/shared/layout/site-shell";

export default function Layout({ children }: LayoutProps<"/external">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
