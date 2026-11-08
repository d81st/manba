import { SiteHeader } from "@/shared/layout/site-header";

export default function KnowledgeLayout({ children }: LayoutProps<"/knowledge">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
