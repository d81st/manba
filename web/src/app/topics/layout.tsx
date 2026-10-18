import "@fontsource/amiri-quran/arabic-400.css";
import { SiteHeader } from "@/components/site-header";

export default function TopicsLayout({ children }: LayoutProps<"/topics">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
