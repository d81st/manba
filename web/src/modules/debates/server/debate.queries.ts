import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { DEBATES_TAG } from "../debate.constants";
import type {
  DebateDetail,
  DebateListItem,
  DebateQueueItem,
  DebateQuote,
  DebateStatus,
  Mention,
  MoveKind,
  MoveRow,
  Verdict,
} from "../debate.types";

const LIST = `id::int, question, language, status, created_by AS "createdBy", partner,
  to_char(created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"`;

type QuoteRow = {
  address: string;
  text: string;
  cut: boolean;
  title: string;
  sunni: number | null;
  shia: number | null;
};

// Invitations for this person, their disputes that are not published yet, and
// the outcomes everyone may read.
export async function listDebates(login: string) {
  const [invitations, mine, published] = await Promise.all([
    db().query<DebateListItem>(
      `SELECT ${LIST} FROM debates WHERE status = 'proposed' AND partner = $1 ORDER BY id DESC LIMIT 50`,
      [login],
    ),
    db().query<DebateListItem>(
      `SELECT ${LIST} FROM debates
       WHERE (created_by = $1 OR partner = $1) AND status <> 'published'
         AND NOT (status = 'proposed' AND partner = $1)
       ORDER BY id DESC LIMIT 50`,
      [login],
    ),
    db().query<DebateListItem>(
      `SELECT ${LIST} FROM debates WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 50`,
    ),
  ]);
  return { invitations: invitations.rows, mine: mine.rows, published: published.rows };
}

export async function listDebateQueue(): Promise<DebateQueueItem[]> {
  const { rows } = await db().query<DebateQueueItem>(
    `SELECT ${LIST},
            (SELECT count(*)::int FROM debate_moves m WHERE m.debate_id = d.id AND m.address IS NOT NULL) AS cited,
            (SELECT count(*)::int FROM debate_moves m
               JOIN debate_checks c ON c.move_id = m.id
              WHERE m.debate_id = d.id AND m.address IS NOT NULL) AS checked
     FROM debates d
     WHERE d.status IN ('proposed', 'open', 'closed')
     ORDER BY d.id DESC
     LIMIT 100`,
  );
  return rows;
}

type MoveQuery = {
  id: number;
  parentId: number | null;
  kind: MoveKind;
  body: string;
  address: string | null;
  author: string;
  createdAt: string;
  verdict: Verdict | null;
  checkNote: string | null;
};

export async function getDebate(id: number): Promise<DebateDetail | null> {
  const { rows } = await db().query<Omit<DebateDetail, "moves">>(
    `SELECT d.id::int, d.question, d.language, d.status, d.created_by AS "createdBy", d.partner,
            t.slug AS "topicSlug", d.pending_question AS "pendingQuestion",
            d.pending_question_by AS "pendingQuestionBy", d.close_requested_by AS "closeRequestedBy",
            d.editor_note AS "editorNote", d.published_by AS "publishedBy",
            to_char(d.created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"
     FROM debates d
     LEFT JOIN topics t ON t.id = d.topic_id
     WHERE d.id = $1`,
    [id],
  );
  const debate = rows[0];
  if (!debate) return null;
  const moves = await db().query<MoveQuery>(
    `SELECT m.id::int, m.parent_id::int AS "parentId", m.kind, m.body, m.address::text AS address, m.author,
            to_char(m.created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt",
            c.verdict, c.note AS "checkNote"
     FROM debate_moves m
     LEFT JOIN debate_checks c ON c.move_id = m.id
     WHERE m.debate_id = $1
     ORDER BY m.id`,
    [id],
  );
  const cited = [...new Set(moves.rows.flatMap((move) => (move.address ? [move.address] : [])))];
  const quotes = await loadQuotes(cited);
  return {
    ...debate,
    status: debate.status as DebateStatus,
    moves: moves.rows.map((move) => ({
      ...move,
      checkNote: move.checkNote ?? "",
      quote: move.address ? (quotes.get(move.address) ?? null) : null,
    })),
  };
}

// The Arabic primary text, its recorded level, and — for an ayah — the
// approved Russian translation. Nothing is copied into the debate.
async function loadQuotes(addresses: string[]): Promise<Map<string, DebateQuote>> {
  const found = new Map<string, DebateQuote>();
  if (addresses.length === 0) return found;
  const [arabic, russian] = await Promise.all([
    db().query<QuoteRow>(
      `SELECT DISTINCT ON (t.address) t.address::text AS address, left(t.content, 600) AS text,
              length(t.content) > 600 AS cut,
              coalesce(w.titles->>'ru-short', w.titles->>'ru', w.id) AS title,
              w.authority_sunni::int AS sunni, w.authority_shia::int AS shia
       FROM texts t
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
       JOIN works w ON w.id = v.work_id
       WHERE t.address = ANY ($1::extensions.ltree[])
       ORDER BY t.address, v.id`,
      [addresses],
    ),
    db().query<{ address: string; text: string }>(
      `SELECT t.address::text AS address, left(t.content, 600) AS text
       FROM texts t
       WHERE t.address = ANY ($1::extensions.ltree[])
         AND t.version_id = (
           SELECT id FROM text_versions
           WHERE work_id = 'quran' AND language = 'ru' AND kind = 'translation' AND status = 'published'
           ORDER BY created_at, id LIMIT 1
         )`,
      [addresses],
    ),
  ]);
  const translation = new Map(russian.rows.map((row) => [row.address, row.text]));
  for (const row of arabic.rows) {
    found.set(row.address, { ...row, translation: translation.get(row.address) ?? null });
  }
  return found;
}

// Published disputes that cite these fragments. Cached; publishing calls updateTag.
export async function debatesForAddresses(addresses: string[]): Promise<Record<string, Mention[]>> {
  "use cache";
  cacheTag(DEBATES_TAG);
  cacheLife("hours");
  const result: Record<string, Mention[]> = {};
  if (addresses.length === 0) return result;
  const { rows } = await db().query<Mention & { address: string }>(
    `SELECT DISTINCT m.address::text AS address, d.id::int AS id, d.question
     FROM debate_moves m
     JOIN debates d ON d.id = m.debate_id AND d.status = 'published'
     WHERE m.address = ANY ($1::extensions.ltree[])
     ORDER BY id`,
    [addresses],
  );
  for (const row of rows) {
    const list = (result[row.address] ??= []);
    if (!list.some((item) => item.id === row.id)) list.push({ id: row.id, question: row.question });
  }
  return result;
}

// The record kept for analysis: the claims and the checks, not a copy of the sources.
export async function debateExport(id: number) {
  const debate = await getDebate(id);
  if (!debate) return null;
  return {
    id: debate.id,
    question: debate.question,
    language: debate.language,
    status: debate.status,
    participants: [debate.createdBy, debate.partner],
    topic: debate.topicSlug,
    note: debate.editorNote,
    moves: debate.moves.map((move) => ({
      id: move.id,
      parentId: move.parentId,
      kind: move.kind,
      body: move.body,
      address: move.address,
      author: move.author,
      verdict: move.verdict,
      note: move.checkNote,
    })),
  };
}

export type { MoveRow };
