import { SiteShell } from "@/shared/layout/site-shell";

export default function TestsLayout({ children }: LayoutProps<"/tests">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
