import { SiteHeader } from "@/shared/layout/site-header";

export default function BookmarksLayout({ children }: LayoutProps<"/bookmarks">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
