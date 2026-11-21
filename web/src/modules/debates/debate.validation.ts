// What a person may send into a debate. No database here, so it is unit-tested.
import { parseRefs } from "@/shared/addresses/refs";
import { MOVE_KINDS, VERDICTS, type MoveKind, type Verdict } from "./debate.types";

export const MIN_QUESTION = 12;
export const MAX_QUESTION = 300;
export const MAX_BODY = 500;
export const MAX_NOTE = 500;
export const MAX_DEPTH = 12;
export const MAX_MOVES = 200;
export const PROPOSALS_PER_DAY = 5;
export const MOVES_PER_DAY = 40;

const SLUG = /^[a-z][a-z0-9-]*$/;

export type Proposal = {
  question: string;
  language: "ru" | "en";
  partner: string;
  topic: string | null;
};

export type MoveDraft = {
  kind: MoveKind;
  body: string;
  address: string | null;
  parentId: number | null;
};

export type ProposalProblem = "tooShort" | "tooLong" | "language" | "partner" | "topic";
export type MoveProblem = "kind" | "tooShort" | "tooLong" | "address" | "parent";

function clean(raw: unknown) {
  if (typeof raw !== "string") return "";
  return raw.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

export function positiveId(raw: unknown): number | null {
  const text = typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
  if (!/^\d+$/.test(text)) return null;
  const id = Number(text);
  if (id < 1 || id > 2_000_000_000) return null;
  return id;
}

export function checkQuestion(raw: unknown): { question?: string; problem?: "tooShort" | "tooLong" } {
  const question = clean(raw);
  if (question.length < MIN_QUESTION) return { problem: "tooShort" };
  if (question.length > MAX_QUESTION) return { problem: "tooLong" };
  return { question };
}

export function checkProposal(raw: {
  question: unknown;
  language: unknown;
  partner: unknown;
  topic: unknown;
}): { proposal?: Proposal; problem?: ProposalProblem } {
  const question = checkQuestion(raw.question);
  if (!question.question) return { problem: question.problem };
  if (raw.language !== "ru" && raw.language !== "en") return { problem: "language" };
  const partner = typeof raw.partner === "string" ? raw.partner.trim() : "";
  if (!partner || partner.length > 80) return { problem: "partner" };
  const topic = typeof raw.topic === "string" ? raw.topic.trim() : "";
  if (topic && (topic.length > 80 || !SLUG.test(topic))) return { problem: "topic" };
  return { proposal: { question: question.question, language: raw.language, partner, topic: topic || null } };
}

// One fragment, written the way the library is cited ("2:255", "Бухари 1").
function oneAddress(raw: unknown): { address: string | null; problem?: "address" } {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return { address: null };
  const { addresses, invalid } = parseRefs(text);
  if (invalid.length > 0 || addresses.length !== 1) return { address: null, problem: "address" };
  return { address: addresses[0] };
}

export function checkMove(raw: {
  kind: unknown;
  body: unknown;
  address: unknown;
  parent: unknown;
}): { move?: MoveDraft; problem?: MoveProblem } {
  const kind = MOVE_KINDS.find((item) => item === raw.kind);
  if (!kind) return { problem: "kind" };
  const body = clean(raw.body);
  if (body.length < 1) return { problem: "tooShort" };
  if (body.length > MAX_BODY) return { problem: "tooLong" };
  const parentText = raw.parent === undefined || raw.parent === null ? "" : String(raw.parent);
  const parentId = parentText === "" ? null : positiveId(parentText);
  if (parentText !== "" && parentId === null) return { problem: "parent" };
  if (kind === "question" && parentId !== null) return { problem: "parent" };
  if (kind !== "question" && parentId === null) return { problem: "parent" };
  const cited = oneAddress(raw.address);
  if (cited.problem) return { problem: "address" };
  if (kind === "answer" && !cited.address) return { problem: "address" };
  return { move: { kind, body, address: cited.address, parentId } };
}

export function checkNote(raw: unknown): { note?: string; problem?: "note" } {
  const note = clean(raw);
  if (note.length > MAX_NOTE) return { problem: "note" };
  return { note };
}

export function checkVerdict(raw: unknown): Verdict | null {
  return VERDICTS.find((item) => item === raw) ?? null;
}
