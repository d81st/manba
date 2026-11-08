import type { Messages } from "@/i18n";

// The pieces of the Quran map share these types: what a lens colors, the order
// of the suras, a cell (sura and ayah) and the card shown for it.
export type MapStrings = Messages["quran"];
export type Lens = "none" | "place" | "juz" | "length" | "search" | "thread";
export type Thread = { addresses: string[]; parallels: { slug: string; title: string }[] };
export type Order = "mushaf" | "revelation";
export type Point = { sura: number; ayah: number };
export type Card = Point & { left: number; top: number; pinned: boolean };

export const LENSES: Lens[] = ["none", "place", "juz", "length", "search", "thread"];
export const MIN_CELL = 3;
export const MAX_CELL = 16;

