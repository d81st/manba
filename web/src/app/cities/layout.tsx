import { SiteShell } from "@/shared/layout/site-shell";

export default function CitiesLayout({ children }: LayoutProps<"/cities">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
