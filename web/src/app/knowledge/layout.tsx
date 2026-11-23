import { SiteShell } from "@/shared/layout/site-shell";

export default function KnowledgeLayout({ children }: LayoutProps<"/knowledge">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
