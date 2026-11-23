import { SiteShell } from "@/shared/layout/site-shell";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
