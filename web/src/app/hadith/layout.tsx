import { SiteHeader } from "@/shared/layout/site-header";

export default function HadithLayout({ children }: LayoutProps<"/hadith">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
