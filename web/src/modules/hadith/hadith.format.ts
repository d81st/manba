
// Name before a number: "Абу Дауд 12". Works loaded before short names were
// stored drop the "Сахих".
export function shortTitle(title: string, short: string | null) {
  return short ?? title.replace(/^Сахих /, "");
}

// Link to a page of a book, with the anchor of a hadith on it.
export function bookPageHref(work: string, book: number, page = 1, anchor?: string) {
  return `/hadith/${work}/book/${book}${page > 1 ? `?page=${page}` : ""}${anchor ? `#${anchor}` : ""}`;
}
