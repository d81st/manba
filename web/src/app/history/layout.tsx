import { SiteHeader } from "@/shared/layout/site-header";

export default function HistoryLayout({ children }: LayoutProps<"/history">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
