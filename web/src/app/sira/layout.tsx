import { SiteHeader } from "@/components/site-header";

export default function SiraLayout({ children }: LayoutProps<"/sira">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
