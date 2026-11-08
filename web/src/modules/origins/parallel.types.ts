import type { ParallelInput } from "./parallel.validation";
import type { HadithRef } from "@/modules/hadith";

export type ParallelSummary = {
  id: number;
  slug: string;
  title: string;
  tradition: string;
  kind: string;
  degree: string;
  basis: string;
  status: string;
  islam: string; // "5:45"
  external: string; // "Исход 21:23-25"
};

export type ParallelForEdit = ParallelInput & { id: number };

// What a link shows: each referenced passage with its text.
export type RefItem =
  | { kind: "ayah"; address: string; label: string; href: string; text: string }
  | { kind: "hadith"; ref: HadithRef }
  | {
      kind: "external";
      label: string; // "Исход 21:23-25"
      href: string;
      dir: "rtl" | "ltr";
      language: string;
      verses: { address: string; n: number; original: string; translation: string }[];
    };

export type PublicParallel = ParallelSummary & {
  basisNote: string;
  traditionReading: string;
  traditionNote: string;
  researchReading: string;
  researchNote: string;
  islamItems: RefItem[];
  externalItems: RefItem[];
  basisItems: RefItem[];
  traditionItems: RefItem[];
  researchItems: RefItem[];
};
