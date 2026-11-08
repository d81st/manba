import { TERM_STATUSES } from "@/lib/input";

// Cache tag of everything shown on topic pages: saving a topic or a side refreshes it.
export const TOPICS_TAG = "topics";

export const TOPIC_STATUSES = TERM_STATUSES;

// Topics of the section «История текста Корана» (quran_text) are also listed
// on its own page, /quran-text; cards of people and events of «Жизнеописание
// пророка» (sira), on /sira; the cities of «Священные города» (cities), on
// /cities; early non-Muslim testimonies about Islam (testimony), on /origins;
// «Ислам и наука» (science — a scholar, science_claims — a claim that a text
// foretells a discovery), on /science.
export const TOPIC_CATEGORIES = ["general", "hard", "quran_text", "sira", "cities", "testimony", "science", "science_claims"] as const;
export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

// Categories the public list of topics can be narrowed to (/topics?category=…).
export const LIST_FILTERS = ["hard", "quran_text", "sira", "cities", "testimony", "science"] as const;
export type ListFilter = (typeof LIST_FILTERS)[number];

// Ayahs shown before and after each main passage.
export const CONTEXT_AYAHS = 3;
