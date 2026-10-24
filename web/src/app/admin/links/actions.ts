"use server";

import { refresh, updateTag } from "next/cache";
import { requireSession } from "@/lib/auth";
import { HADITH_TAG } from "@/lib/hadith";
import { reviewPair, VERDICTS } from "@/lib/hadith-links";

// A verdict on a pair of similar texts; hadith pages show it at once.
export async function reviewPairAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  const verdict = VERDICTS.find((v) => v === formData.get("verdict"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!Number.isInteger(id) || id <= 0 || !verdict) return;
  if (await reviewPair(id, verdict, note, session.login)) updateTag(HADITH_TAG);
  refresh();
}
