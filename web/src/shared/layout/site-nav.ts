// The sections of the site for the left panel: one list, grouped by what a
// reader does (sources, the encyclopedia, overviews, working with the
// sources). The order is practical, not a ranking. Second levels come from
// constants, not from the database, so the panel costs no query.
import { COLLECTION_ORDER, COLLECTIONS } from "@/shared/addresses/hadith-query";
import { getMessages } from "@/shared/i18n";

export type NavItem = { href: string; label: string; children?: NavItem[] };
export type NavGroup = { label: string; items: NavItem[] };

export function siteNav(): NavGroup[] {
  const t = getMessages();
  const s = t.home.sections;
  const n = t.nav;
  return [
    {
      label: n.sources,
      items: [
        { href: "/quran", label: n.quran },
        {
          href: "/hadith",
          label: n.hadith,
          children: COLLECTION_ORDER.filter((w) => !COLLECTIONS[w].group).map((w) => ({ href: `/hadith/${w}`, label: COLLECTIONS[w].label })),
        },
        { href: "/library", label: s.library },
        { href: "/quran-text", label: s.quranText },
      ],
    },
    {
      label: n.encyclopedia,
      items: [
        {
          href: "/topics",
          label: s.encyclopedia,
          children: [
            { href: "/topics", label: n.allTopics },
            { href: "/topics?category=hard", label: s.hardTopics },
          ],
        },
        { href: "/glossary", label: s.glossary },
        {
          href: "/sira",
          label: s.sira,
          children: [
            { href: "/sira/timeline", label: n.timeline },
            { href: "/sira/map", label: n.map },
            { href: "/sira/people", label: n.people },
          ],
        },
        { href: "/cities", label: s.cities },
        { href: "/origins", label: s.origins },
        { href: "/science", label: s.science },
        { href: "/history", label: s.timeline },
        { href: "/not-found-in-sources", label: s.notFound },
      ],
    },
    {
      label: n.overviews,
      items: [
        { href: "/quran/map", label: s.quranMap },
        { href: "/knowledge", label: s.knowledgeMap },
        { href: "/galaxy", label: s.galaxy },
      ],
    },
    {
      label: n.work,
      items: [
        { href: "/assistant", label: s.assistant },
        { href: "/tests", label: s.tests },
        { href: "/debates", label: s.debates },
        { href: "/bookmarks", label: s.bookmarks },
      ],
    },
  ];
}

// Whether a link is the page being read or the section it belongs to: the
// longest matching path wins, so "/quran/map" is not also "/quran".
export function activeHref(pathname: string, groups: NavGroup[]): string | null {
  const hrefs = groups.flatMap((g) => g.items.flatMap((i) => [i.href, ...(i.children ?? []).map((c) => c.href)]));
  const paths = [...new Set(hrefs.map((h) => h.split("?")[0]))];
  const matches = paths.filter((p) => pathname === p || pathname.startsWith(`${p}/`));
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}

// The groups with only the items (and children) whose label contains the words.
export function filterNav(groups: NavGroup[], query: string): NavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  const has = (label: string) => label.toLowerCase().includes(q);
  return groups
    .map((g) => ({
      label: g.label,
      items: g.items.flatMap((item) => {
        const children = (item.children ?? []).filter((c) => has(c.label));
        if (has(item.label)) return [item];
        return children.length ? [{ ...item, children }] : [];
      }),
    }))
    .filter((g) => g.items.length > 0);
}
