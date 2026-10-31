import { SiteHeader } from "@/components/site-header";

export default function ScienceLayout({ children }: LayoutProps<"/science">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
