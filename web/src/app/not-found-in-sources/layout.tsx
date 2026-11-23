import { SiteShell } from "@/shared/layout/site-shell";

export default function NotFoundInSourcesLayout({ children }: LayoutProps<"/not-found-in-sources">) {
  return (
    <SiteShell>{children}</SiteShell>
  );
}
