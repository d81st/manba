import { SiteHeader } from "@/shared/layout/site-header";

export default function ScienceLayout({ children }: LayoutProps<"/science">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
