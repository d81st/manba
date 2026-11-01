import { SiteHeader } from "@/components/site-header";

export default function AssistantLayout({ children }: LayoutProps<"/assistant">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
