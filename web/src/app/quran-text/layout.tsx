import { SiteHeader } from "@/components/site-header";

export default function QuranTextLayout({
  children,
}: LayoutProps<"/quran-text">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
