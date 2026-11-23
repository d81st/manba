import { SiteShell } from "@/shared/layout/site-shell";
import { adminNav } from "./admin-nav";

// The admin in the same frame as the site, with its own sections on the left.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <SiteShell groups={adminNav()}>{children}</SiteShell>;
}
