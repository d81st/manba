import { SiteHeader } from "@/components/site-header";

export default function Layout({ children }: LayoutProps<"/origins">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
