import "@fontsource/amiri-quran/arabic-400.css";
import { SiteHeader } from "@/shared/layout/site-header";

export default function TopicsLayout({ children }: LayoutProps<"/topics">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
