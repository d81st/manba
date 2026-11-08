import { SiteHeader } from "@/shared/layout/site-header";

export default function TestsLayout({ children }: LayoutProps<"/tests">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
