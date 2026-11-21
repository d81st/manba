import { SiteHeader } from "@/shared/layout/site-header";

export default function DebatesLayout({ children }: LayoutProps<"/debates">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
