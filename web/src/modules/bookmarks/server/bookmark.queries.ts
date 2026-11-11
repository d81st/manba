import "server-only";
import { db } from "@/shared/db";
import { type CheckedBookmark, MAX_BOOKMARKS } from "../bookmark.validation";

export type Bookmark = { id: number; page: string; title: string; note: string; createdAt: string };

// A person's bookmarks, the newest first.
export async function listBookmarks(owner: string): Promise<Bookmark[]> {
  const { rows } = await db().query<Bookmark>(
    `SELECT id::int, page, title, note, to_char(created_at AT TIME ZONE 'UTC', 'DD.MM.YYYY') AS "createdAt"
     FROM bookmarks WHERE owner = $1 ORDER BY id DESC`,
    [owner],
  );
  return rows;
}

// Saves a bookmark (the same place again takes the new name and note);
// false when the person already keeps the most allowed.
export async function saveBookmark(owner: string, bookmark: CheckedBookmark): Promise<boolean> {
  const { rowCount } = await db().query(
    `INSERT INTO bookmarks (owner, page, title, note)
     SELECT $1, $2, $3, $4
     WHERE (SELECT count(*) FROM bookmarks WHERE owner = $1) < $5
        OR EXISTS (SELECT 1 FROM bookmarks WHERE owner = $1 AND page = $2)
     ON CONFLICT (owner, page) DO UPDATE SET title = EXCLUDED.title, note = EXCLUDED.note`,
    [owner, bookmark.page, bookmark.title, bookmark.note, MAX_BOOKMARKS],
  );
  return rowCount === 1;
}

// Removes a person's own bookmark.
export async function deleteBookmark(owner: string, id: number) {
  await db().query("DELETE FROM bookmarks WHERE owner = $1 AND id = $2", [owner, id]);
}
