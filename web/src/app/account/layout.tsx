import { SiteHeader } from "@/shared/layout/site-header";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
