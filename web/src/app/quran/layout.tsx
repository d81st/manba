// Quran font, served from our own server (OFL, @fontsource): no requests to
// third-party font hosts, since an interest in religion is sensitive data.
import "@fontsource/amiri-quran/arabic-400.css";
import { SiteHeader } from "@/components/site-header";

export default function QuranLayout({ children }: LayoutProps<"/quran">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
