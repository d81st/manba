import { SiteHeader } from "@/shared/layout/site-header";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
