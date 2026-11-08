import { SiteHeader } from "@/shared/layout/site-header";

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
