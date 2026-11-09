// The kinds of stars in their order, and which works go to which kind.
import type { GalaxyKind } from "./galaxy.types";

export const GALAXY_KINDS: GalaxyKind[] = ["quran", "hadith", "books", "external", "topic"];

export function kindOfCategory(canon: string, category: string): GalaxyKind {
  if (category === "quran") return "quran";
  if (category === "hadith") return "hadith";
  if (canon === "external") return "external";
  return "books";
}

// Books of two hadith collections are joined when they share at least this
// many similar texts; weaker ties would turn the picture into a fog.
export const MIN_SHARED_TEXTS = 10;
