import { SiteShell } from "@/shared/layout/site-shell";

export default function BookmarksLayout({ children }: LayoutProps<"/bookmarks">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
