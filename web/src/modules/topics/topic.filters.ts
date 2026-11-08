import { LIST_FILTERS, type ListFilter } from "./topic.constants";
import type { TopicSummary } from "./topic.types";

// The filter of the public list from the address (?category=…), or none.
export function listFilterOf(category: unknown): ListFilter | null {
  return LIST_FILTERS.find((key) => key === category) ?? null;
}

// Topics of the chosen filter; «Ислам и наука» holds both of its categories.
export function filterTopics(topics: TopicSummary[], filter: ListFilter | null) {
  return topics.filter(
    (topic) => !filter || topic.category === filter || (filter === "science" && topic.category === "science_claims"),
  );
}
