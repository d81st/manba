import "server-only";
import type pg from "pg";
import { resolveBookRefs } from "@/modules/library/server";
import { db } from "@/shared/db";
import { isValidLogin, normalizeLogin } from "@/shared/auth/passwords";
import { moveProblem } from "../debate.rules";
import type { MoveKind, Verdict } from "../debate.types";
import { MOVES_PER_DAY, PROPOSALS_PER_DAY, type MoveDraft, type Proposal } from "../debate.validation";

export type DebateFailure =
  | "partner"
  | "self"
  | "unknown"
  | "disabled"
  | "topic"
  | "tooMany"
  | "status"
  | "notParticipant"
  | "parent"
  | "sameAuthor"
  | "address"
  | "missing"
  | "depth"
  | "full"
  | "pending"
  | "unchecked"
  | "unavailable";

export type DebateResult = { ok: true; id?: number } | { ok: false; problem: DebateFailure };

type Locked = { id: number; status: string; createdBy: string; partner: string };

function pgCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

async function topicId(client: pg.PoolClient, slug: string | null): Promise<number | null | "bad"> {
  if (!slug) return null;
  const { rows } = await client.query<{ id: number }>(
    "SELECT id::int AS id FROM topics WHERE slug = $1 AND status = 'published'",
    [slug],
  );
  return rows[0]?.id ?? "bad";
}

// The partner is an enabled account, or the main administrator from the server
// settings (that login is not a row in users).
async function resolvePartner(raw: string, actor: string): Promise<{ login: string } | { problem: DebateFailure }> {
  const owner = process.env.SITE_LOGIN ?? "";
  const login = owner && normalizeLogin(raw) === normalizeLogin(owner) ? owner : normalizeLogin(raw);
  if (!login || login.length > 80) return { problem: "partner" };
  if (login === actor || normalizeLogin(login) === normalizeLogin(actor)) return { problem: "self" };
  if (owner && login === owner) return { login };
  if (!isValidLogin(login)) return { problem: "partner" };
  const { rows } = await db().query<{ disabled: boolean }>("SELECT disabled FROM users WHERE login = $1", [login]);
  if (!rows[0]) return { problem: "unknown" };
  if (rows[0].disabled) return { problem: "disabled" };
  return { login };
}

export async function proposeDebate(input: Proposal, actor: string): Promise<DebateResult> {
  if (actor.length < 1 || actor.length > 80) return { ok: false, problem: "unavailable" };
  const partner = await resolvePartner(input.partner, actor);
  if ("problem" in partner) return { ok: false, problem: partner.problem };
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const topic = await topicId(client, input.topic);
    if (topic === "bad") {
      await client.query("ROLLBACK");
      return { ok: false, problem: "topic" };
    }
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO debates (question, language, created_by, partner, topic_id)
       SELECT $1, $2, $3, $4, $5
       WHERE (SELECT count(*) FROM debates WHERE created_by = $3 AND created_at > now() - interval '1 day') < $6
       RETURNING id::int AS id`,
      [input.question, input.language, actor, partner.login, topic, PROPOSALS_PER_DAY],
    );
    await client.query("COMMIT");
    return rows[0] ? { ok: true, id: rows[0].id } : { ok: false, problem: "tooMany" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function mark(sql: string, params: unknown[], problem: DebateFailure): Promise<DebateResult> {
  const { rowCount } = await db().query(sql, params);
  return rowCount ? { ok: true } : { ok: false, problem };
}

export function editQuestion(id: number, question: string, actor: string) {
  return mark(
    `UPDATE debates SET question = $2, updated_at = now()
     WHERE id = $1 AND status = 'proposed' AND created_by = $3`,
    [id, question, actor],
    "status",
  );
}

export function acceptDebate(id: number, actor: string) {
  return mark(
    `UPDATE debates SET status = 'open', updated_at = now() WHERE id = $1 AND status = 'proposed' AND partner = $2`,
    [id, actor],
    "status",
  );
}

export function declineDebate(id: number, actor: string) {
  return mark(
    `UPDATE debates SET status = 'declined', updated_at = now() WHERE id = $1 AND status = 'proposed' AND partner = $2`,
    [id, actor],
    "status",
  );
}

export function withdrawDebate(id: number, actor: string) {
  return mark(
    `UPDATE debates SET status = 'withdrawn', updated_at = now() WHERE id = $1 AND status = 'proposed' AND created_by = $2`,
    [id, actor],
    "status",
  );
}

export function proposeQuestion(id: number, question: string, actor: string) {
  return mark(
    `UPDATE debates SET pending_question = $2, pending_question_by = $3, updated_at = now()
     WHERE id = $1 AND status = 'open' AND pending_question IS NULL AND (created_by = $3 OR partner = $3)`,
    [id, question, actor],
    "pending",
  );
}

export function acceptQuestion(id: number, actor: string) {
  return mark(
    `UPDATE debates
        SET question = pending_question, pending_question = NULL, pending_question_by = NULL, updated_at = now()
      WHERE id = $1 AND status = 'open' AND pending_question IS NOT NULL AND pending_question_by <> $2
        AND (created_by = $2 OR partner = $2)`,
    [id, actor],
    "status",
  );
}

export function clearQuestion(id: number, actor: string, own: boolean) {
  return mark(
    `UPDATE debates SET pending_question = NULL, pending_question_by = NULL, updated_at = now()
     WHERE id = $1 AND status = 'open' AND pending_question_by IS NOT NULL
       AND pending_question_by ${own ? "=" : "<>"} $2
       AND (created_by = $2 OR partner = $2)`,
    [id, actor],
    "status",
  );
}

// The second request, from the other participant, closes the dispute.
export function requestClose(id: number, actor: string) {
  return mark(
    `UPDATE debates SET
       status = CASE WHEN close_requested_by IS NOT NULL AND close_requested_by <> $2 THEN 'closed' ELSE status END,
       close_requested_by = CASE
         WHEN close_requested_by IS NULL THEN $2
         WHEN close_requested_by = $2 THEN close_requested_by
         ELSE NULL END,
       updated_at = now()
     WHERE id = $1 AND status = 'open' AND (created_by = $2 OR partner = $2)`,
    [id, actor],
    "status",
  );
}

export function adminClose(id: number) {
  return mark(
    `UPDATE debates SET status = 'closed', close_requested_by = NULL, updated_at = now() WHERE id = $1 AND status = 'open'`,
    [id],
    "status",
  );
}

export function adminReopen(id: number) {
  return mark(
    `UPDATE debates SET status = 'open', close_requested_by = NULL, updated_at = now() WHERE id = $1 AND status = 'closed'`,
    [id],
    "status",
  );
}

const LEVELS = ["ayah", "hadith", "narration", "page", "passage", "comment"];

async function lockDebate(client: pg.PoolClient, id: number): Promise<Locked | null> {
  const { rows } = await client.query<Locked>(
    `SELECT id::int, status, created_by AS "createdBy", partner FROM debates WHERE id = $1 FOR UPDATE`,
    [id],
  );
  return rows[0] ?? null;
}

export async function postMove(id: number, draft: MoveDraft, actor: string): Promise<DebateResult> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const debate = await lockDebate(client, id);
    if (!debate || debate.status !== "open") {
      await client.query("ROLLBACK");
      return { ok: false, problem: "status" };
    }
    if (actor !== debate.createdBy && actor !== debate.partner) {
      await client.query("ROLLBACK");
      return { ok: false, problem: "notParticipant" };
    }
    const today = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM debate_moves WHERE author = $1 AND created_at > now() - interval '1 day'`,
      [actor],
    );
    if (today.rows[0].n >= MOVES_PER_DAY) {
      await client.query("ROLLBACK");
      return { ok: false, problem: "tooMany" };
    }
    const existing = await client.query<{ id: number; parentId: number | null; author: string; kind: MoveKind }>(
      `SELECT id::int, parent_id::int AS "parentId", author, kind FROM debate_moves WHERE debate_id = $1`,
      [id],
    );
    const problem = moveProblem(draft, existing.rows, actor);
    if (problem) {
      await client.query("ROLLBACK");
      return { ok: false, problem };
    }
    let address = draft.address;
    if (address) {
      [address] = await resolveBookRefs(client, [address]);
      const missing = await client.query(
        `SELECT 1 FROM unnest($1::text[]) AS a
         WHERE NOT EXISTS (
           SELECT 1 FROM addresses x
           WHERE x.address = a::extensions.ltree AND x.level = ANY ($2::text[])
         )`,
        [[address], LEVELS],
      );
      if (missing.rowCount) {
        await client.query("ROLLBACK");
        return { ok: false, problem: "missing" };
      }
    }
    await client.query(
      `INSERT INTO debate_moves (debate_id, parent_id, kind, body, address, author)
       VALUES ($1, $2, $3, $4, $5::extensions.ltree, $6)`,
      [id, draft.parentId, draft.kind, draft.body, address, actor],
    );
    await client.query("UPDATE debates SET updated_at = now() WHERE id = $1", [id]);
    await client.query("COMMIT");
    return { ok: true };
  } catch (error) {
    await client.query("ROLLBACK");
    if (pgCode(error) === "23503") return { ok: false, problem: "missing" };
    throw error;
  } finally {
    client.release();
  }
}

export async function checkMove(debateId: number, moveId: number, verdict: Verdict, note: string, actor: string): Promise<DebateResult> {
  const { rowCount } = await db().query(
    `INSERT INTO debate_checks (move_id, verdict, note, checked_by)
     SELECT m.id, $3, $4, $5
     FROM debate_moves m
     JOIN debates d ON d.id = m.debate_id
     WHERE m.id = $1 AND d.id = $2 AND d.status IN ('open', 'closed') AND m.address IS NOT NULL
     ON CONFLICT (move_id) DO UPDATE
       SET verdict = EXCLUDED.verdict, note = EXCLUDED.note, checked_by = EXCLUDED.checked_by, checked_at = now()`,
    [moveId, debateId, verdict, note, actor],
  );
  if (!rowCount) return { ok: false, problem: "status" };
  await db().query("UPDATE debates SET updated_at = now() WHERE id = $1", [debateId]);
  return { ok: true };
}

export async function publishDebate(id: number, note: string, actor: string): Promise<DebateResult> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const debate = await lockDebate(client, id);
    if (!debate || debate.status !== "closed") {
      await client.query("ROLLBACK");
      return { ok: false, problem: "status" };
    }
    const pending = await client.query(
      `SELECT 1 FROM debate_moves m
       WHERE m.debate_id = $1 AND m.address IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM debate_checks c WHERE c.move_id = m.id)`,
      [id],
    );
    if (pending.rowCount) {
      await client.query("ROLLBACK");
      return { ok: false, problem: "unchecked" };
    }
    const { rowCount } = await client.query(
      `UPDATE debates
          SET status = 'published', editor_note = $2, published_by = $3, published_at = now(),
              pending_question = NULL, pending_question_by = NULL, close_requested_by = NULL, updated_at = now()
        WHERE id = $1 AND status = 'closed'`,
      [id, note, actor],
    );
    await client.query("COMMIT");
    return rowCount ? { ok: true } : { ok: false, problem: "status" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
