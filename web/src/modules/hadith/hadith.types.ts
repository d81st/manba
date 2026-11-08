import type { Scheme } from "@/shared/addresses/hadith-query";

export type Attribution = { title: string; url: string; license: string; notice: string; version: string };

export type Collection = {
  id: string;
  title: string;
  shortTitle: string;
  titleAr: string;
  canon: string;
  scheme: Scheme;
  versionId: string;
  versionTitle: string;
  verification: string;
  attribution: Attribution;
  hadiths: number; // distinct hadith numbers
  narrations: number | null; // texts, when narrations of one hadith have their own addresses
  books: {
    number: number;
    title: string;
    hadiths: number;
    narrations: number | null;
    first: number | null;
    last: number | null;
  }[];
};

// A text of another collection with shared wording, found automatically
// (data/sources/links/README.md): a measure, not a claim of one hadith.
export type SimilarText = { label: string; href: string; share: number; checked: boolean };

export type BookHadith = {
  path: number[]; // the address after the work id: [3951], [8, 2], [4, 60, 3]
  variants: number; // texts under the same first number in the whole collection
  text: string;
  numbering: string;
  similar: SimilarText[];
};

export type BookChapter = {
  index: number;
  title: string;
  intro: string;
  unnumbered: string;
  continued: boolean; // began on an earlier page: its heading is repeated, its intro is not
  hadiths: BookHadith[];
};

export type Book = {
  number: number;
  title: string;
  chapters: BookChapter[];
  previous: number | null;
  next: number | null;
  page: number;
  pages: number;
};

export type HadithHit = {
  work: string;
  workTitle: string; // short name: "Абу Дауд"
  path: number[];
  variants: number;
  book: number;
  text: string;
};

// A hadith referred to from a topic or a term: its text, or the texts under
// it (the narrations of a number), the first few of them.
export type HadithRef = {
  address: string;
  title: string; // "Муслим 8"
  href: string;
  items: { label: string; text: string }[]; // label only when there are several
  more: number; // texts under it not shown
};
