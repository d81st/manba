import { SiteHeader } from "@/components/site-header";

export default function HadithLayout({ children }: LayoutProps<"/hadith">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
