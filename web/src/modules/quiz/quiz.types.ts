import type { HadithRef } from "@/modules/hadith";

export type QuizAyah = { address: string; sura: number; ayah: number; suraName: string; text: string };

export type QuizQuestion = {
  id: number;
  status: string;
  prompt: string;
  note: string;
  options: { id: number; text: string; correct: boolean }[];
  refs: string[];
  level: { sunni: number | null; shia: number | null };
  topic: { slug: string; title: string; published: boolean } | null;
  term: { slug: string; title: string; published: boolean } | null;
  ayahs: QuizAyah[];
  passages: HadithRef[];
};
