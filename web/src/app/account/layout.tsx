import { SiteHeader } from "@/components/site-header";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
