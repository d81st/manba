import { SiteHeader } from "@/components/site-header";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
