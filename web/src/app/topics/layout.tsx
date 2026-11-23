import "@fontsource/amiri-quran/arabic-400.css";
import { SiteShell } from "@/shared/layout/site-shell";

export default function TopicsLayout({ children }: LayoutProps<"/topics">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
