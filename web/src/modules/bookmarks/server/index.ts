// Server side of the bookmarks module. Import from "@/modules/bookmarks/server".
import "server-only";

export { deleteBookmarkAction, saveBookmarkAction } from "./bookmark.actions";
export { type Bookmark, listBookmarks } from "./bookmark.queries";
