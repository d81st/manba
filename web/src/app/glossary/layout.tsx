import "@fontsource/amiri-quran/arabic-400.css";
import { SiteHeader } from "@/components/site-header";

export default function GlossaryLayout({ children }: LayoutProps<"/glossary">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
