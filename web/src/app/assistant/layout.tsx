import { SiteShell } from "@/shared/layout/site-shell";

export default function AssistantLayout({ children }: LayoutProps<"/assistant">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
