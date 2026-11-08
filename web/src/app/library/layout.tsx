import { SiteHeader } from "@/shared/layout/site-header";

export default function LibraryLayout({ children }: LayoutProps<"/library">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
