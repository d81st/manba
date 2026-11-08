import type { Attribution } from "@/modules/hadith";
import type { BookCategory } from "./library.constants";

export type BookWork = {
  id: string;
  category: BookCategory;
  title: string;
  shortTitle: string;
  titleAr: string;
  versionTitle: string;
  verification: string;
  attribution: Attribution;
  pages: number;
  volumes: { volume: number; first: number; last: number }[];
  sections: { number: number; title: string; first: string; last: string; chapters: number }[];
};

// ayahs: in a tafsir, the ayahs the comment covers (empty elsewhere).
export type BookPiece = { path: number[]; label: string; anchor: string; text: string; ayahs: number[] };

export type BookSection = {
  number: number;
  title: string;
  previous: number | null;
  next: number | null;
  page: number;
  pages: number;
  chapters: { index: number; title: string; pieces: BookPiece[] }[];
};

export type BookHit = { path: number[]; label: string; section: number; sectionTitle: string; text: string };
