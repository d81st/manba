// WHERE conditions of a text search on the stored search forms (texts.search_plain
// and texts.search_vocalized, see arabic.ts). Only search_plain has an index
// (migration 011, to save space); a query with vowel marks also requires its
// letters in search_plain, so the index finds the candidates and
// search_vocalized confirms the vowels. No database here.
import { stripDiacritics } from "./arabic.ts";

// patterns: LIKE patterns ("%word%") of the search form of the query;
// first: the number of the first SQL parameter they take.
export function matchConditions(alias: string, patterns: string[], diacritics: boolean, first: number) {
  const plain = diacritics ? patterns.map(stripDiacritics) : patterns;
  const params = diacritics ? [...plain, ...patterns] : plain;
  const conditions = params.map(
    (_, i) => `${alias}.${i < plain.length ? "search_plain" : "search_vocalized"} LIKE $${first + i}`,
  );
  return { sql: conditions.join(" AND "), params };
}
