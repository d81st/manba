import { SiteHeader } from "@/shared/layout/site-header";

export default function CitiesLayout({ children }: LayoutProps<"/cities">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
