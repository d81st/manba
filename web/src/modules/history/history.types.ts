import type { CheckedHistoryEvent } from "./history.validation";

export type HistoryDate = {
  address: string;
  quote: string;
  holder: string;
  yearAh: number | null;
  yearCe: number | null;
  month: number | null;
  day: number | null;
  variant: boolean;
  note: string;
};

export type HistoryEvent = {
  id: number;
  slug: string;
  layer: string;
  title: string;
  status: string;
  topic: { slug: string; title: string; published: boolean } | null;
  dates: HistoryDate[];
};

export type HistoryEventForEdit = Omit<CheckedHistoryEvent, "dates"> & { id: number; dates: HistoryDate[] };
