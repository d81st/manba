import type { CheckedEvent, CheckedPerson } from "./sira.validation";

export type SiraPlace = {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  lat: number | null;
  lon: number | null;
  coordSource: string;
};

export type SiraDate = {
  address: string;
  quote: string;
  holder: string;
  year: number | null;
  month: number | null;
  day: number | null;
  age: number | null;
  variant: boolean;
  note: string;
};

export type SiraEvent = {
  id: number;
  slug: string;
  kind: string;
  title: string;
  status: string;
  position: number;
  place: string | null;
  topic: { id: number; slug: string; published: boolean } | null;
  dates: SiraDate[];
};

export type SiraPerson = {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  forms: string[];
  status: string;
  topic: { id: number; slug: string; published: boolean } | null;
};

export type SiraRelation = {
  id: number;
  a: string;
  b: string;
  kind: string;
  address: string;
  quote: string;
  note: string;
  status: string;
};

export type SiraData = {
  places: SiraPlace[];
  events: SiraEvent[];
  people: SiraPerson[];
  relations: SiraRelation[];
};

export type EventForEdit = Omit<CheckedEvent, "dates"> & { id: number; dates: SiraDate[] };

export type PersonForEdit = Omit<CheckedPerson, "relations"> & {
  id: number;
  relations: { other: string; kind: string; direction: "out" | "in"; address: string; quote: string; note: string; status: string }[];
};
