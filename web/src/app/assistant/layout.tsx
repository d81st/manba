import { SiteHeader } from "@/shared/layout/site-header";

export default function AssistantLayout({ children }: LayoutProps<"/assistant">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
