"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { withDrafts } from "@/lib/preview-path";
import { safeNext } from "@/lib/safe-next";
import { createPreviewToken, PREVIEW_COOKIE, PREVIEW_MAX_AGE } from "@/lib/session";

// Opens a reader page with drafts. The cookie, not the query alone, is the permit.
export async function enablePreview(formData: FormData) {
  await requireAdmin();
  const token = createPreviewToken();
  if (!token) redirect("/login");
  (await cookies()).set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_MAX_AGE,
  });
  redirect(withDrafts(safeNext(formData.get("next"))));
}
