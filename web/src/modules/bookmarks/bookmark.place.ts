// Where the reader is, read from the page in the browser: the address with
// the fragment at the top of the screen, and a name for it ("Сура 2 · 2:255").
// Used by the bookmark button and by "continue reading".

export type Place = { page: string; title: string };

// Sections whose pages are read from top to bottom: "continue reading"
// remembers the last place in each.
export const READING_SECTIONS = ["quran", "hadith", "library", "external"] as const;
export type ReadingSection = (typeof READING_SECTIONS)[number];

// "/quran/2" is reading; "/quran", "/quran/map", "/quran/search" are not.
export function readingSection(pathname: string): ReadingSection | null {
  const [, section, second, third] = pathname.split("/");
  if (!(READING_SECTIONS as readonly string[]).includes(section) || !second) return null;
  if (second === "map" || second === "search" || third === "search") return null;
  if (section === "quran") return /^\d+$/.test(second) ? "quran" : null;
  // A collection's or a book's contents page is not a place in the text.
  return third ? (section as ReadingSection) : null;
}

// The row of the text at the top of the screen (an ayah, a hadith, a piece of
// a book): rows carry the id their #anchor uses.
function rowAtTop(): HTMLElement | null {
  for (const y of [90, 140, 200, 280]) {
    const row = document.elementFromPoint(window.innerWidth / 2, y)?.closest<HTMLElement>("main li[id]");
    if (row) return row;
  }
  return null;
}

export function currentPlace(): Place {
  const { pathname, search, hash } = window.location;
  const heading = document.querySelector("main h1")?.textContent?.replace(/\s+/g, " ").trim() || document.title;
  // Scrolled into the text: the row on screen; at the top: the page (with its own #anchor, if any).
  const row = window.scrollY > 200 ? rowAtTop() : hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!row?.id) return { page: `${pathname}${search}`, title: heading };
  const label = row.querySelector('a[href^="#"]')?.textContent?.replace(/\s+/g, " ").trim();
  return { page: `${pathname}${search}#${encodeURIComponent(row.id)}`, title: label ? `${heading} · ${label}` : heading };
}
