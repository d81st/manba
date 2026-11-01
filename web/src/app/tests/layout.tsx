import { SiteHeader } from "@/components/site-header";

export default function TestsLayout({ children }: LayoutProps<"/tests">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
