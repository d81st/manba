import { SiteHeader } from "@/shared/layout/site-header";

export default function Layout({ children }: LayoutProps<"/origins">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
