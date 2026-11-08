"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { HADITH_TAG } from "../hadith.constants";
import { VERDICTS } from "../hadith.links";
import { reviewPair } from "./link-review.commands";

// A verdict on a pair of similar texts; hadith pages show it at once.
export async function reviewPairAction(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  const verdict = VERDICTS.find((v) => v === formData.get("verdict"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!Number.isInteger(id) || id <= 0 || !verdict) return;
  if (await reviewPair(id, verdict, note, session.login)) updateTag(HADITH_TAG);
  refresh();
}
