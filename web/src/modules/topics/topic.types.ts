import type { TopicInput } from "./topic.validation";
import type { Passage } from "./topic.passages";
import type { InputProblem } from "@/lib/input";
import type { SiraEvent, SiraPlace } from "@/modules/sira";
import type { HadithRef } from "@/modules/hadith";

// A side whose positions a topic shows (Sunni, Shia, researchers…).
export type Side = { id: number; slug: string; title: string; position: number; used: number };

// A topic in lists: the admin table, the public list, section pages.
export type TopicSummary = {
  id: number;
  slug: string;
  category: string;
  status: string;
  title: string;
  question: string;
  updatedAt: string;
  updatedBy: string;
  place: string | null; // the place on the map (cities)
};

export type TopicForEdit = TopicInput & { id: number };

export type SaveResult = { id?: number; problems: InputProblem[] };

// ---- The public topic page ----

export type TopicAyah = { address: string; sura: number; ayah: number; suraName: string; text: string };

export type MainPassage = Passage & { ayahs: TopicAyah[]; before: TopicAyah[]; after: TopicAyah[] };

export type PublicPosition = {
  side: string;
  holder: string;
  recognition: string;
  text: string;
  sourceNote: string;
  refs: TopicAyah[];
  hadiths: HadithRef[];
};

export type PublicTopic = TopicSummary & {
  circumstances: string;
  circumstancesNote: string;
  main: MainPassage[];
  mainHadiths: HadithRef[];
  circumstancesRefs: TopicAyah[];
  circumstancesHadiths: HadithRef[];
  relatedRefs: TopicAyah[];
  relatedHadiths: HadithRef[];
  // Grouped by side in the order of the sides list.
  sides: { title: string; positions: PublicPosition[] }[];
  terms: { slug: string; translation: string }[];
  related: { slug: string; title: string }[];
};

// The city a topic is about, with the published events of the Prophet's life there.
export type TopicPlace = { place: SiraPlace; events: SiraEvent[] };
