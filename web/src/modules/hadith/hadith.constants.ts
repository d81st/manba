// Cache tag of the hadith pages; sizes of a book page, of the search results
// and of the graph of similar texts.

export const HADITH_TAG = "hadith";

// Long books are read in pages of this many texts (the largest part of the
// Musnad has over eleven thousand).
export const BOOK_PAGE_SIZE = 200;

export const HADITH_SEARCH_LIMIT = 100;

// How many texts the graph shows: the closest ones first, then their own
// closest ones up to the total. Enough to see the clusters, few enough to read.
export const SIMILAR_FIRST = 20;
export const SIMILAR_TOTAL = 36;

// Kinds of nodes: the hadith itself and the groups of collections.
export type SimilarKind = "center" | "sahih" | "sunan" | "musnad" | "kafi" | "other";
export const SIMILAR_KINDS: Exclude<SimilarKind, "center">[] = ["sahih", "sunan", "musnad", "kafi", "other"];
