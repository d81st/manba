// Who may do what in a dispute, and how the tree is built. No database here.
import { bookPath, isBook } from "@/shared/addresses/book-query";
import { hadithPath } from "@/shared/addresses/hadith-query";
import { MAX_DEPTH, MAX_MOVES } from "./debate.validation";
import type { DebateStatus, MoveKind } from "./debate.types";

type MoveRef = { id: number; parentId: number | null; author: string; kind: MoveKind };

export type TreeNode<T> = T & { children: TreeNode<T>[] };

// A published dispute is readable by anyone signed in. Anything else is
// visible to the two participants and to the administrator.
export function canSee(
  debate: { status: DebateStatus; createdBy: string; partner: string },
  session: { login: string; role: string },
) {
  if (session.role === "admin") return true;
  if (debate.status === "published") return true;
  return session.login === debate.createdBy || session.login === debate.partner;
}

export function isParticipant(debate: { createdBy: string; partner: string }, login: string) {
  return login === debate.createdBy || login === debate.partner;
}

// The page of a library address. Quotes on the debate page link here.
export function placeHref(address: string) {
  const [work, ...rest] = address.split(".");
  const path = rest.map(Number);
  if (work === "quran" && path.length >= 2 && path.every((n) => Number.isInteger(n))) {
    return `/quran/${path[0]}#${path[0]}-${path[1]}`;
  }
  if (isBook(work)) return bookPath(work, path);
  return hadithPath(work, path);
}

// Depth of a new move. 1 is a root question. null means the parent is missing
// or the chain loops.
export function moveDepth(parentId: number | null, moves: { id: number; parentId: number | null }[]): number | null {
  if (parentId === null) return 1;
  const byId = new Map(moves.map((move) => [move.id, move]));
  let depth = 1;
  let current: number | null = parentId;
  const seen = new Set<number>();
  while (current !== null) {
    if (seen.has(current) || !byId.has(current)) return null;
    seen.add(current);
    depth += 1;
    current = byId.get(current)!.parentId;
  }
  return depth;
}

// An answer hangs on a question or a counter-question, and the other person
// writes it. A counter-question may hang on any move. A new question is a new root.
export function moveProblem(
  draft: { kind: MoveKind; parentId: number | null },
  moves: MoveRef[],
  author: string,
): "parent" | "sameAuthor" | "depth" | "full" | null {
  if (moves.length >= MAX_MOVES) return "full";
  const depth = moveDepth(draft.parentId, moves);
  if (depth === null) return "parent";
  if (depth > MAX_DEPTH) return "depth";
  if (draft.kind === "question") return null;
  const parent = moves.find((move) => move.id === draft.parentId);
  if (!parent) return "parent";
  if (draft.kind === "answer" && parent.kind === "answer") return "parent";
  if (draft.kind === "answer" && parent.author === author) return "sameAuthor";
  return null;
}

export function uncheckedIds(moves: { id: number; address: string | null; verdict: string | null }[]) {
  return moves.filter((move) => move.address && !move.verdict).map((move) => move.id);
}

// Roots first. A move whose parent is missing is shown at the root, so a row
// is never dropped from the page.
export function treeOf<T extends { id: number; parentId: number | null }>(rows: T[]): TreeNode<T>[] {
  const ids = new Set(rows.map((row) => row.id));
  const children = new Map<number | null, T[]>();
  for (const row of rows) {
    const parent = row.parentId !== null && ids.has(row.parentId) ? row.parentId : null;
    const list = children.get(parent) ?? [];
    list.push(row);
    children.set(parent, list);
  }
  const walk = (parent: number | null, trail: Set<number>): TreeNode<T>[] =>
    (children.get(parent) ?? []).flatMap((row) => {
      if (trail.has(row.id)) return [];
      const next = new Set(trail);
      next.add(row.id);
      return [{ ...row, children: walk(row.id, next) }];
    });
  return walk(null, new Set());
}
