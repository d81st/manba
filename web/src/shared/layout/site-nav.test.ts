import { describe, expect, it } from "vitest";
import { activeHref, filterNav, type NavGroup } from "./site-nav";

// Fictional sections, not the site's own list.
const groups: NavGroup[] = [
  {
    label: "Источники",
    items: [
      { href: "/quran", label: "Коран" },
      { href: "/hadith", label: "Хадисы", children: [{ href: "/hadith/bukhari", label: "Бухари" }] },
    ],
  },
  { label: "Обзоры", items: [{ href: "/quran/map", label: "Карта Корана" }] },
];

describe("activeHref", () => {
  it("takes the longest matching path", () => {
    expect(activeHref("/quran/map", groups)).toBe("/quran/map");
    expect(activeHref("/quran/2", groups)).toBe("/quran");
    expect(activeHref("/hadith/bukhari/1", groups)).toBe("/hadith/bukhari");
    expect(activeHref("/elsewhere", groups)).toBeNull();
  });
});

describe("filterNav", () => {
  it("keeps the items and children whose names contain the words", () => {
    expect(filterNav(groups, "бух")).toEqual([
      { label: "Источники", items: [{ href: "/hadith", label: "Хадисы", children: [{ href: "/hadith/bukhari", label: "Бухари" }] }] },
    ]);
    expect(filterNav(groups, "корАн").map((g) => g.items.map((i) => i.label))).toEqual([["Коран"], ["Карта Корана"]]);
    expect(filterNav(groups, "  ")).toBe(groups);
  });
});
