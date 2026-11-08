// Shared pieces of the library queries (internal to the module's server side).

export const PATH = (column: string) => `string_to_array(subpath(${column}, 1)::text, '.')::int[]`;

// Long sections (a surah of a tafsir runs to a million letters) are read in
// pages of about this many letters; a text is never cut.
export const PAGE_LETTERS = 80_000;
