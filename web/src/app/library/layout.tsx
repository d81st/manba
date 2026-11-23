import { SiteShell } from "@/shared/layout/site-shell";

export default function LibraryLayout({ children }: LayoutProps<"/library">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
