"use server";

import { refresh } from "next/cache";
import { requireSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { bookmarkOwner, type BookmarkProblem, checkBookmark } from "../bookmark.validation";
import { deleteBookmark, saveBookmark } from "./bookmark.queries";

export type BookmarkFormState = { saved?: boolean; problem?: BookmarkProblem | "tooMany" | "unavailable" };

// Any signed-in person keeps bookmarks of their own.
export async function saveBookmarkAction(_prev: BookmarkFormState, formData: FormData): Promise<BookmarkFormState> {
  const session = await requireSession();
  const { bookmark, problem } = checkBookmark({ page: formData.get("page"), title: formData.get("title"), note: formData.get("note") });
  if (!bookmark) return { problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  try {
    return (await saveBookmark(bookmarkOwner(session), bookmark)) ? { saved: true } : { problem: "tooMany" };
  } catch {
    return { problem: "unavailable" };
  }
}

export async function deleteBookmarkAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return;
  await deleteBookmark(bookmarkOwner(session), id);
  refresh();
}
