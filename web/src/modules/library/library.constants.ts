// Books of the library other than the Quran and the hadith collections (sira,
// tafsir, readings, chronicles, sciences, theology), read by sections and pages.


// Books with their own references (docs/ADDRESSES.md): the Sira of Ibn Hisham,
// Kitab al-Sab'a and Ansab al-ashraf by volume and page, the Tafsir of Ibn
// Kathir by surah and ayah. Sections
// and chapters for reading; pieces of pages or comments on ayahs as texts.
export const BOOKS_TAG = "books";

export const BOOK_CATEGORIES = ["sira", "tafsir", "qiraat", "history", "sciences", "theology"] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export const BOOK_SEARCH_LIMIT = 100;
