import type { HadithRef } from "@/lib/hadith";
import type { InputProblem } from "@/lib/input";
import type { RELATION_KINDS } from "./term.constants";
import type { TermInput } from "./term.validation";

export type RelationKind = (typeof RELATION_KINDS)[number];

export type TermSummary = {
  id: number;
  slug: string;
  arabic: string;
  transliteration: string;
  translation: string;
  short: string;
  status: string;
  isBasic: boolean;
  basicOrder: number | null;
  updatedAt: string;
  updatedBy: string;
};

export type TermForEdit = TermInput & { id: number; relatedNames: Record<number, string> };

export type SaveResult = { id?: number; problems: InputProblem[] };

export type RefAyah = { address: string; sura: number; ayah: number; suraName: string; text: string };
export type PublicDefinition = {
  holder: string;
  recognition: string;
  text: string;
  sourceNote: string;
  refs: RefAyah[];
  hadiths: HadithRef[];
};
export type PublicTerm = TermSummary & {
  detail: string;
  refs: RefAyah[];
  hadiths: HadithRef[];
  definitions: PublicDefinition[];
  related: { slug: string; translation: string; transliteration: string; kind: RelationKind }[];
};
