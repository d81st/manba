import { SiteHeader } from "@/components/site-header";

export default function LibraryLayout({ children }: LayoutProps<"/library">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
