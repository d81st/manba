import { SiteShell } from "@/shared/layout/site-shell";

export default function Layout({ children }: LayoutProps<"/origins">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
