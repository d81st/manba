import type { ReactNode } from "react";
import { getMessages } from "@/shared/i18n";
import { AccountBar, SiteHeader } from "./site-header";
import { type NavGroup, siteNav } from "./site-nav";
import { MobileMenu, SiteSidebar } from "./site-sidebar";

// The frame of a reader's page, as in the documentation of a framework: the
// header, the tree of the whole site on the left (a "Menu" button on a phone)
// and the page itself. The admin passes its own sections.
export function SiteShell({ children, groups = siteNav() }: { children: ReactNode; groups?: NavGroup[] }) {
  const t = getMessages().nav;
  const labels = { sections: t.sections, filter: t.filter, menu: t.menu, close: t.close, nothing: t.nothing };
  return (
    <>
      <SiteHeader
        menu={
          <MobileMenu groups={groups} labels={labels}>
            <AccountBar />
          </MobileMenu>
        }
      />
      <div className="flex min-w-0">
        <SiteSidebar groups={groups} labels={labels} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
