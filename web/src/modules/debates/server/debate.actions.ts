"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { DEBATES_TAG } from "../debate.constants";
import {
  checkMove,
  checkNote,
  checkProposal,
  checkQuestion,
  checkVerdict,
  positiveId,
} from "../debate.validation";
import {
  acceptDebate,
  acceptQuestion,
  adminClose,
  adminReopen,
  checkMove as saveCheck,
  clearQuestion,
  declineDebate,
  editQuestion,
  postMove,
  proposeDebate,
  proposeQuestion,
  publishDebate,
  requestClose,
  withdrawDebate,
  type DebateFailure,
} from "./debate.commands";

export type DebateFormState = {
  sent?: boolean;
  problem?: DebateFailure | "tooShort" | "tooLong" | "language" | "topic" | "kind" | "note" | "address" | "parent";
};

function unavailable(error: unknown): DebateFormState {
  if (typeof error === "object" && error !== null && "digest" in error) throw error;
  return { problem: "unavailable" };
}

export async function proposeDebateAction(_prev: DebateFormState, formData: FormData): Promise<DebateFormState> {
  const session = await requireSession();
  const checked = checkProposal({
    question: formData.get("question"),
    language: formData.get("language"),
    partner: formData.get("partner"),
    topic: formData.get("topic"),
  });
  if (!checked.proposal) return { problem: checked.problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  let id = 0;
  try {
    const result = await proposeDebate(checked.proposal, session.login);
    if (!result.ok || !result.id) return { problem: result.ok ? "unavailable" : result.problem };
    id = result.id;
  } catch (error) {
    return unavailable(error);
  }
  redirect(`/debates/${id}`);
}

export async function editQuestionAction(_prev: DebateFormState, formData: FormData): Promise<DebateFormState> {
  const session = await requireSession();
  const id = positiveId(formData.get("id"));
  const question = checkQuestion(formData.get("question"));
  if (!id) return { problem: "status" };
  if (!question.question) return { problem: question.problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  try {
    const result = await editQuestion(id, question.question, session.login);
    if (!result.ok) return { problem: result.problem };
  } catch (error) {
    return unavailable(error);
  }
  refresh();
  return {};
}

export async function proposeQuestionAction(_prev: DebateFormState, formData: FormData): Promise<DebateFormState> {
  const session = await requireSession();
  const id = positiveId(formData.get("id"));
  const question = checkQuestion(formData.get("question"));
  if (!id) return { problem: "status" };
  if (!question.question) return { problem: question.problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  try {
    const result = await proposeQuestion(id, question.question, session.login);
    if (!result.ok) return { problem: result.problem };
  } catch (error) {
    return unavailable(error);
  }
  refresh();
  return {};
}

export async function postMoveAction(_prev: DebateFormState, formData: FormData): Promise<DebateFormState> {
  const session = await requireSession();
  const id = positiveId(formData.get("id"));
  const checked = checkMove({
    kind: formData.get("kind"),
    body: formData.get("body"),
    address: formData.get("address"),
    parent: formData.get("parent"),
  });
  if (!id) return { problem: "status" };
  if (!checked.move) return { problem: checked.problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  try {
    const result = await postMove(id, checked.move, session.login);
    if (!result.ok) return { problem: result.problem };
  } catch (error) {
    return unavailable(error);
  }
  refresh();
  return { sent: true };
}

export async function checkMoveAction(_prev: DebateFormState, formData: FormData): Promise<DebateFormState> {
  const session = await requireAdmin();
  const debateId = positiveId(formData.get("id"));
  const moveId = positiveId(formData.get("move"));
  const verdict = checkVerdict(formData.get("verdict"));
  const note = checkNote(formData.get("note"));
  if (!debateId || !moveId || !verdict) return { problem: "status" };
  if (note.problem) return { problem: note.problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  try {
    const result = await saveCheck(debateId, moveId, verdict, note.note ?? "", session.login);
    if (!result.ok) return { problem: result.problem };
  } catch (error) {
    return unavailable(error);
  }
  refresh();
  return {};
}

export async function publishDebateAction(_prev: DebateFormState, formData: FormData): Promise<DebateFormState> {
  const session = await requireAdmin();
  const id = positiveId(formData.get("id"));
  const note = checkNote(formData.get("note"));
  if (!id) return { problem: "status" };
  if (note.problem) return { problem: note.problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  try {
    const result = await publishDebate(id, note.note ?? "", session.login);
    if (!result.ok) return { problem: result.problem };
  } catch (error) {
    return unavailable(error);
  }
  updateTag(DEBATES_TAG);
  refresh();
  return {};
}

async function simple(formData: FormData, run: (id: number, login: string) => Promise<{ ok: boolean }>, admin = false) {
  const session = admin ? await requireAdmin() : await requireSession();
  const id = positiveId(formData.get("id"));
  if (!id || !isDatabaseConfigured()) return;
  try {
    await run(id, session.login);
  } catch {
    return;
  }
  refresh();
}

export async function acceptDebateAction(formData: FormData) {
  await simple(formData, (id, login) => acceptDebate(id, login));
}

export async function declineDebateAction(formData: FormData) {
  await simple(formData, (id, login) => declineDebate(id, login));
}

export async function withdrawDebateAction(formData: FormData) {
  await simple(formData, (id, login) => withdrawDebate(id, login));
}

export async function acceptQuestionAction(formData: FormData) {
  await simple(formData, (id, login) => acceptQuestion(id, login));
}

export async function rejectQuestionAction(formData: FormData) {
  await simple(formData, (id, login) => clearQuestion(id, login, false));
}

export async function cancelQuestionAction(formData: FormData) {
  await simple(formData, (id, login) => clearQuestion(id, login, true));
}

export async function requestCloseAction(formData: FormData) {
  await simple(formData, (id, login) => requestClose(id, login));
}

export async function adminCloseAction(formData: FormData) {
  await simple(formData, (id) => adminClose(id), true);
}

export async function adminReopenAction(formData: FormData) {
  await simple(formData, (id) => adminReopen(id), true);
}
