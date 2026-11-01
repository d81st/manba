import { SiteHeader } from "@/components/site-header";

export default function NotFoundInSourcesLayout({ children }: LayoutProps<"/not-found-in-sources">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
