import { SiteHeader } from "@/shared/layout/site-header";

export default function SiraLayout({ children }: LayoutProps<"/sira">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
