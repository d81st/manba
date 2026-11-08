export type SuraSummary = {
  number: number;
  names: { ar: string; translit: string; en: string };
  ayahs: number;
  revelationPlace: string | null; // traditional classification
};

export type Segment = {
  address: string;
  level: "ayah" | "basmala";
  number: number;
  text: string;
  translation: string | null; // the Russian translation, with its markup (lib/translation-markup.ts)
};

export type Attribution = { title: string; url: string; license: string; version: string };

export type TranslationInfo = Attribution & { versionTitle: string; verification: string };

export type Sura = SuraSummary & {
  segments: Segment[];
  attribution: Attribution | null;
  translation: TranslationInfo | null;
};

export type SearchHit = {
  address: string;
  sura: number;
  ayah: number;
  suraName: string;
  text: string; // primary version (Uthmani)
  alt: string | null; // the same ayah in standard spelling, if loaded
  translation: string | null; // the Russian translation, with its markup
};

export type SearchResult = { hits: SearchHit[]; total: number };

export type MapSura = {
  number: number;
  name: string; // transliteration
  ar: string;
  place: string | null; // traditional classification
  order: number | null; // traditional order of revelation
  words: number[]; // words per ayah in the Uthmani text (pause marks excluded)
  juz: number[]; // juz of each ayah
};
