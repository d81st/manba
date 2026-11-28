"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/shared/auth/auth";
import { saveReviewCheck, type ReviewDecision } from "./review.commands";

export type ReviewCheckState = { saved?: ReviewDecision; failed?: boolean };

const DECISIONS: ReviewDecision[] = ["check", "uncheck", "note"];
const MAX_NOTE = 2000;

// One item of «Что проверить»: the pressed button sends "decision", the form the remark "note".
export async function saveReviewCheckAction(
  topicId: number,
  item: string,
  _prev: ReviewCheckState,
  formData: FormData,
): Promise<ReviewCheckState> {
  const session = await requireAdmin();
  const decision = DECISIONS.find((d) => d === formData.get("decision"));
  const note = String(formData.get("note") ?? "").trim().slice(0, MAX_NOTE);
  if (!decision) return { failed: true };
  const result = await saveReviewCheck(topicId, item, decision, note, session.login);
  if (result !== "saved") return { failed: true };
  refresh();
  return { saved: decision };
}
