// Bookmarks: what a reader may save. No database here, so it is unit-tested.

export const MAX_TITLE = 200;
export const MAX_NOTE = 500;
export const MAX_PAGE = 500;
// One person keeps at most this many bookmarks.
export const MAX_BOOKMARKS = 500;

export type BookmarkProblem = "noTitle" | "badPage";
export type CheckedBookmark = { page: string; title: string; note: string };

// The page is a path of this site ("/quran/2#2-255"), never another site's address.
export function checkBookmark(raw: { page: unknown; title: unknown; note: unknown }): { bookmark?: CheckedBookmark; problem?: BookmarkProblem } {
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
  const page = typeof raw.page === "string" ? raw.page.trim() : "";
  if (!page.startsWith("/") || page.startsWith("//") || page.startsWith("/\\") || page.length > MAX_PAGE || /[\u0000-\u001f]/.test(page)) {
    return { problem: "badPage" };
  }
  const title = text(raw.title, MAX_TITLE);
  if (!title) return { problem: "noTitle" };
  return { bookmark: { page, title, note: text(raw.note, MAX_NOTE) } };
}

// The owner of bookmarks for a session: the main administrator or an account.
export function bookmarkOwner(session: { uid?: number }) {
  return session.uid ? `user:${session.uid}` : "owner";
}
