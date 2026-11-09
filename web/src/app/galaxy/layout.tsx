import { SiteHeader } from "@/shared/layout/site-header";

export default function GalaxyLayout({ children }: LayoutProps<"/galaxy">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
