import { SiteHeader } from "@/components/site-header";

export default function CitiesLayout({ children }: LayoutProps<"/cities">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
