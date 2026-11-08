// WHERE conditions of a text search (docs/DATA_MODEL.md, migration 012).
// Each text keeps one stored search form, texts.search_plain (letters only,
// see arabic.ts). Its trigram index covers the collections searched all at
// once (Quran, hadith); a single book is searched without it, by its own
// rows. A query with vowel marks also requires its letters in search_plain,
// and the vowels are checked on those candidates by search_key(content, true),
// the database copy of searchKey(text, { diacritics: true }). No database here.
import { stripDiacritics } from "./arabic.ts";

// patterns: LIKE patterns ("%word%") of the search form of the query;
// first: the number of the first SQL parameter they take; indexed: the texts
// searched are in the index (Quran, hadith), which the query must say to use it.
export function matchConditions(
  alias: string,
  patterns: string[],
  diacritics: boolean,
  first: number,
  indexed = false,
) {
  const plain = diacritics ? patterns.map(stripDiacritics) : patterns;
  const params = diacritics ? [...plain, ...patterns] : plain;
  const conditions = params.map((_, i) =>
    i < plain.length
      ? `${alias}.search_plain LIKE $${first + i}`
      : `search_key(${alias}.content, true) LIKE $${first + i}`,
  );
  if (indexed) conditions.push(`search_indexed(${alias}.version_id)`);
  return { sql: conditions.join(" AND "), params };
}
