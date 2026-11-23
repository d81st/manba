// The sections of the admin for its left panel, grouped by the work:
// materials to enter, things to check, people.
import { getMessages } from "@/shared/i18n";
import type { NavGroup } from "@/shared/layout/site-nav";

export function adminNav(): NavGroup[] {
  const t = getMessages();
  const s = t.admin.sections;
  const n = t.nav;
  return [
    {
      label: n.adminMaterials,
      items: [
        { href: "/admin", label: n.adminHome },
        { href: "/admin/topics", label: s.topics },
        { href: "/admin/terms", label: s.terms },
        { href: "/admin/sira", label: s.sira },
        { href: "/admin/origins", label: s.origins },
        { href: "/admin/history", label: s.history },
        { href: "/admin/tests", label: s.tests },
        { href: "/admin/videos", label: s.videos },
        { href: "/admin/sides", label: s.sides },
      ],
    },
    {
      label: n.adminChecks,
      items: [
        { href: "/admin/findings", label: s.findings },
        { href: "/admin/reports", label: s.reports },
        { href: "/admin/debates", label: s.debates },
        { href: "/admin/links", label: s.links },
        { href: "/admin/assistant", label: s.assistant },
        { href: "/admin/errors", label: s.errors },
      ],
    },
    {
      label: n.adminPeople,
      items: [
        { href: "/admin/users", label: s.users },
        { href: "/", label: n.toSite },
      ],
    },
  ];
}
