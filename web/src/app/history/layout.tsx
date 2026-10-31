import { SiteHeader } from "@/components/site-header";

export default function HistoryLayout({ children }: LayoutProps<"/history">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
