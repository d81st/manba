import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type pg from "pg";
import { defaultLocale } from "@/i18n";
import { db } from "@/lib/db";
import { formatRefs, parseRefs, type InputProblem } from "@/lib/glossary-input";
import { CONTEXT_AYAHS, passagesOf, type TopicInput } from "@/lib/topics-input";

export const TOPICS_TAG = "topics";
const LOCALE = defaultLocale;

type RefRole = "main" | "related" | "circumstances" | "position";

// ============ Sides ============

export type Side = { id: number; slug: string; title: string; position: number; used: number };

export async function listSides(): Promise<Side[]> {
  const { rows } = await db().query<Side>(
    `SELECT s.id::int, s.slug, x.title, s.position,
            (SELECT count(*)::int FROM topic_positions p WHERE p.side_id = s.id) AS used
     FROM position_sides s JOIN position_side_texts x ON x.side_id = s.id AND x.locale = $1
     ORDER BY s.position, x.title`,
    [LOCALE],
  );
  return rows;
}

export type SideInput = { slug: string; title: string; position: number };

export async function saveSide(id: number | null, input: SideInput, actor: string): Promise<InputProblem[]> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const taken = await client.query("SELECT 1 FROM position_sides WHERE slug = $1 AND id IS DISTINCT FROM $2", [
      input.slug,
      id,
    ]);
    if (taken.rowCount) {
      await client.query("ROLLBACK");
      return [{ field: "slug", code: "slugTaken" }];
    }
    const before = id
      ? (
          await client.query(
            `SELECT s.slug, x.title, s.position FROM position_sides s
             JOIN position_side_texts x ON x.side_id = s.id AND x.locale = $2 WHERE s.id = $1 FOR UPDATE OF s`,
            [id, LOCALE],
          )
        ).rows[0]
      : null;
    if (id && !before) {
      await client.query("ROLLBACK");
      return [{ field: "", code: "notFound" }];
    }
    let sideId = id;
    if (sideId) {
      await client.query("UPDATE position_sides SET slug = $2, position = $3 WHERE id = $1", [
        sideId,
        input.slug,
        input.position,
      ]);
    } else {
      const created = await client.query<{ id: number }>(
        "INSERT INTO position_sides (slug, position) VALUES ($1, $2) RETURNING id::int",
        [input.slug, input.position],
      );
      sideId = created.rows[0].id;
    }
    await client.query(
      `INSERT INTO position_side_texts (side_id, locale, title) VALUES ($1, $2, $3)
       ON CONFLICT (side_id, locale) DO UPDATE SET title = EXCLUDED.title`,
      [sideId, LOCALE, input.title],
    );
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, actor)
       VALUES ('position_side', $1, $2, $3, $4, $5)`,
      [String(sideId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(input), actor],
    );
    await client.query("COMMIT");
    return [];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ============ Admin ============

export type TopicSummary = {
  id: number;
  slug: string;
  category: string;
  status: string;
  title: string;
  question: string;
  updatedAt: string;
  updatedBy: string;
};

const SUMMARY = `
  SELECT t.id::int, t.slug, t.category, t.status, x.title, x.question,
         t.updated_at::text AS "updatedAt", t.updated_by AS "updatedBy"
  FROM topics t JOIN topic_texts x ON x.topic_id = t.id AND x.locale = '${LOCALE}'`;

export async function listTopicsForAdmin(status?: string, category?: string): Promise<TopicSummary[]> {
  const { rows } = await db().query<TopicSummary>(
    `${SUMMARY} WHERE ($1::text IS NULL OR t.status = $1) AND ($2::text IS NULL OR t.category = $2)
     ORDER BY t.updated_at DESC`,
    [status ?? null, category ?? null],
  );
  return rows;
}

export type TopicForEdit = TopicInput & { id: number };

export async function getTopicForEdit(id: number): Promise<TopicForEdit | null> {
  const topic = await db().query(
    `SELECT t.*, x.title, x.question, x.circumstances, x.circumstances_note FROM topics t
     JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $2 WHERE t.id = $1`,
    [id, LOCALE],
  );
  const row = topic.rows[0];
  if (!row) return null;

  const refs = await db().query<{ role: RefRole; position_id: string | null; address: string }>(
    "SELECT role, position_id, address::text FROM topic_refs WHERE topic_id = $1 ORDER BY position",
    [id],
  );
  const positions = await db().query(
    `SELECT id, side_id::int, holder, recognition, text, source_note FROM topic_positions
     WHERE topic_id = $1 AND locale = $2 ORDER BY position`,
    [id, LOCALE],
  );
  const terms = await db().query<{ id: number }>("SELECT term_id::int AS id FROM topic_terms WHERE topic_id = $1", [id]);
  const related = await db().query<{ id: number }>(
    "SELECT related_id::int AS id FROM topic_relations WHERE topic_id = $1",
    [id],
  );
  const refsOf = (role: RefRole, positionId: string | null = null) =>
    formatRefs(refs.rows.filter((r) => r.role === role && r.position_id === positionId).map((r) => r.address));

  return {
    id,
    slug: row.slug,
    category: row.category,
    status: row.status,
    title: row.title,
    question: row.question,
    mainRefs: refsOf("main"),
    circumstances: row.circumstances,
    circumstancesNote: row.circumstances_note,
    circumstancesRefs: refsOf("circumstances"),
    relatedRefs: refsOf("related"),
    positions: positions.rows.map((p) => ({
      sideId: p.side_id,
      holder: p.holder,
      recognition: p.recognition,
      text: p.text,
      sourceNote: p.source_note,
      refs: refsOf("position", String(p.id)),
    })),
    terms: terms.rows.map((r) => r.id),
    related: related.rows.map((r) => r.id),
    reason: "",
  };
}

// Topics to pick as related ones (any status, so drafts can be linked).
export async function listTopicChoices(): Promise<{ id: number; name: string }[]> {
  const { rows } = await db().query<{ id: number; name: string }>(
    `SELECT t.id::int, x.title AS name FROM topics t
     JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $1
     WHERE t.status <> 'retired' ORDER BY x.title`,
    [LOCALE],
  );
  return rows;
}

async function missingAddresses(client: pg.PoolClient, addresses: string[]) {
  if (addresses.length === 0) return [];
  const { rows } = await client.query<{ address: string }>(
    `SELECT a FROM unnest($1::text[]) AS a
     WHERE NOT EXISTS (SELECT 1 FROM addresses x WHERE x.address = a::extensions.ltree AND x.level = 'ayah')`,
    [addresses],
  );
  return rows.map((r) => r.address);
}

async function countExisting(client: pg.PoolClient, table: "topics" | "terms" | "position_sides", ids: number[]) {
  if (ids.length === 0) return 0;
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table} WHERE id = ANY($1::bigint[])`, [ids]);
  return rows[0].n as number;
}

export type SaveResult = { id?: number; problems: InputProblem[] };

// Creates (id = null) or updates a topic in one transaction, with a journal entry.
export async function saveTopic(id: number | null, input: TopicInput, actor: string): Promise<SaveResult> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const problems: InputProblem[] = [];

    const before = id ? await getTopicForEdit(id) : null;
    if (id && !before) {
      await client.query("ROLLBACK");
      return { problems: [{ field: "", code: "notFound" }] };
    }
    if (before && before.status === "published" && before.slug !== input.slug) {
      problems.push({ field: "slug", code: "slugPublished" });
    }
    if (before && before.status === "published" && !input.reason) {
      problems.push({ field: "reason", code: "reason" });
    }
    const taken = await client.query("SELECT 1 FROM topics WHERE slug = $1 AND id IS DISTINCT FROM $2", [
      input.slug,
      id,
    ]);
    if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });

    const refFields = { main: "mainRefs", circumstances: "circumstancesRefs", related: "relatedRefs" } as const;
    const refs = Object.fromEntries(
      Object.entries(refFields).map(([role, field]) => [role, parseRefs(input[field]).addresses]),
    ) as Record<keyof typeof refFields, string[]>;
    for (const [role, field] of Object.entries(refFields) as [keyof typeof refFields, string][]) {
      const missing = await missingAddresses(client, refs[role]);
      if (missing.length) problems.push({ field, code: "refsMissing", detail: formatRefs(missing) });
    }
    for (const [i, position] of input.positions.entries()) {
      const lost = await missingAddresses(client, parseRefs(position.refs).addresses);
      if (lost.length) problems.push({ field: `positions.${i}.refs`, code: "refsMissing", detail: formatRefs(lost) });
    }
    const sideIds = [...new Set(input.positions.map((p) => p.sideId))];
    if ((await countExisting(client, "position_sides", sideIds)) !== sideIds.length) {
      problems.push({ field: "positions", code: "side" });
    }
    if ((await countExisting(client, "terms", input.terms)) !== input.terms.length) {
      problems.push({ field: "terms", code: "terms" });
    }
    const relatedIds = input.related.filter((relatedId) => relatedId !== id);
    if ((await countExisting(client, "topics", relatedIds)) !== relatedIds.length) {
      problems.push({ field: "related", code: "related" });
    }
    if (problems.length) {
      await client.query("ROLLBACK");
      return { problems };
    }

    let topicId = id;
    if (topicId) {
      await client.query(
        `UPDATE topics SET slug = $2, category = $3, status = $4, updated_by = $5, updated_at = now() WHERE id = $1`,
        [topicId, input.slug, input.category, input.status, actor],
      );
    } else {
      const created = await client.query<{ id: number }>(
        `INSERT INTO topics (slug, category, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4) RETURNING id::int`,
        [input.slug, input.category, input.status, actor],
      );
      topicId = created.rows[0].id;
    }

    await client.query(
      `INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (topic_id, locale) DO UPDATE
         SET title = EXCLUDED.title, question = EXCLUDED.question,
             circumstances = EXCLUDED.circumstances, circumstances_note = EXCLUDED.circumstances_note`,
      [topicId, LOCALE, input.title, input.question, input.circumstances, input.circumstancesNote],
    );

    // Positions and references are replaced as a whole on every save.
    await client.query("DELETE FROM topic_refs WHERE topic_id = $1", [topicId]);
    await client.query("DELETE FROM topic_positions WHERE topic_id = $1 AND locale = $2", [topicId, LOCALE]);
    for (const role of ["main", "circumstances", "related"] as const) {
      await insertRefs(client, topicId, role, null, refs[role]);
    }
    for (const [order, position] of input.positions.entries()) {
      const created = await client.query<{ id: string }>(
        `INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          topicId,
          position.sideId,
          LOCALE,
          position.holder,
          position.recognition,
          position.text,
          position.sourceNote,
          order,
        ],
      );
      await insertRefs(client, topicId, "position", created.rows[0].id, parseRefs(position.refs).addresses);
    }

    await client.query("DELETE FROM topic_terms WHERE topic_id = $1", [topicId]);
    if (input.terms.length) {
      await client.query(
        "INSERT INTO topic_terms (topic_id, term_id) SELECT $1, unnest($2::bigint[])",
        [topicId, input.terms],
      );
    }
    // Relations are kept in both directions.
    await client.query("DELETE FROM topic_relations WHERE topic_id = $1 OR related_id = $1", [topicId]);
    for (const relatedId of relatedIds) {
      await client.query(
        "INSERT INTO topic_relations (topic_id, related_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING",
        [topicId, relatedId],
      );
    }

    const { reason, ...snapshot } = input;
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('topic', $1, $2, $3, $4, $5, $6)`,
      [
        String(topicId),
        id ? "updated" : "created",
        before ? JSON.stringify({ ...before, reason: undefined }) : null,
        JSON.stringify(snapshot),
        reason,
        actor,
      ],
    );
    await client.query("COMMIT");
    return { id: topicId, problems: [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertRefs(
  client: pg.PoolClient,
  topicId: number,
  role: RefRole,
  positionId: string | null,
  addresses: string[],
) {
  if (addresses.length === 0) return;
  await client.query(
    `INSERT INTO topic_refs (topic_id, role, position_id, address, position)
     SELECT $1, $2, $3, a::extensions.ltree, p - 1 FROM unnest($4::text[]) WITH ORDINALITY AS t(a, p)`,
    [topicId, role, positionId, addresses],
  );
}

// Only drafts can be deleted; anything that was ever shown is retired instead.
export async function deleteDraftTopic(id: number, actor: string) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const topic = await client.query(
      `SELECT t.status, t.slug, x.title FROM topics t
       LEFT JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $2 WHERE t.id = $1 FOR UPDATE OF t`,
      [id, LOCALE],
    );
    const row = topic.rows[0];
    const everPublished = await client.query(
      `SELECT 1 FROM change_log WHERE entity = 'topic' AND entity_id = $1 AND new_value->>'status' = 'published'`,
      [String(id)],
    );
    if (!row || row.status !== "draft" || everPublished.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("DELETE FROM topics WHERE id = $1", [id]);
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, reason, actor)
       VALUES ('topic', $1, 'deleted', $2, 'Удалён черновик', $3)`,
      [String(id), JSON.stringify({ slug: row.slug, title: row.title }), actor],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ============ Public ============

export async function listPublishedTopics(): Promise<TopicSummary[]> {
  "use cache";
  cacheTag(TOPICS_TAG);
  cacheLife("hours");
  const { rows } = await db().query<TopicSummary>(
    `${SUMMARY} WHERE t.status = 'published' ORDER BY lower(x.title)`,
  );
  return rows;
}

export type TopicAyah = { address: string; sura: number; ayah: number; suraName: string; text: string };
export type MainPassage = { sura: number; from: number; to: number; ayahs: TopicAyah[]; before: TopicAyah[]; after: TopicAyah[] };
export type PublicPosition = {
  side: string;
  holder: string;
  recognition: string;
  text: string;
  sourceNote: string;
  refs: TopicAyah[];
};
export type PublicTopic = TopicSummary & {
  circumstances: string;
  circumstancesNote: string;
  main: MainPassage[];
  circumstancesRefs: TopicAyah[];
  relatedRefs: TopicAyah[];
  // Grouped by side in the order of the sides list.
  sides: { title: string; positions: PublicPosition[] }[];
  terms: { slug: string; translation: string }[];
  related: { slug: string; title: string }[];
};

type AyahRow = { address: string; text: string; sura_name: string };

const AYAH_TEXT = `
  JOIN texts t ON t.address = a.address
  JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published'
    AND v.work_id = 'quran' AND v.language = 'ar'
  JOIN addresses s ON s.address = subpath(a.address, 0, 2)`;

function toAyah(row: AyahRow): TopicAyah {
  const [, sura, ayah] = row.address.split(".").map(Number);
  return { address: row.address, sura, ayah, suraName: row.sura_name, text: row.text };
}

// Ayahs of a sura between two numbers (both included), in order.
async function ayahRange(sura: number, from: number, to: number): Promise<TopicAyah[]> {
  if (to < from) return [];
  const { rows } = await db().query<AyahRow>(
    `SELECT a.address::text, t.content AS text, s.names->>'translit' AS sura_name
     FROM addresses a ${AYAH_TEXT}
     WHERE a.level = 'ayah' AND a.address <@ $1::extensions.ltree
       AND split_part(a.address::text, '.', 3)::int BETWEEN $2 AND $3
     ORDER BY a.ordinal`,
    [`quran.${sura}`, from, to],
  );
  return rows.map(toAyah);
}

export async function getPublishedTopic(slug: string): Promise<PublicTopic | null> {
  "use cache";
  cacheTag(TOPICS_TAG);
  cacheLife("hours");
  const summary = await db().query<TopicSummary & { circumstances: string; circumstancesNote: string }>(
    `SELECT s.*, x.circumstances, x.circumstances_note AS "circumstancesNote"
     FROM (${SUMMARY} WHERE t.slug = $1 AND t.status = 'published') s
     JOIN topic_texts x ON x.topic_id = s.id AND x.locale = '${LOCALE}'`,
    [slug],
  );
  const topic = summary.rows[0];
  if (!topic) return null;

  const refs = await db().query<AyahRow & { role: RefRole; position_id: string | null }>(
    `SELECT r.role, r.position_id, a.address::text, t.content AS text, s.names->>'translit' AS sura_name
     FROM topic_refs r JOIN addresses a ON a.address = r.address ${AYAH_TEXT}
     WHERE r.topic_id = $1 ORDER BY r.position`,
    [topic.id],
  );
  const refsOf = (role: RefRole, positionId: string | null = null) =>
    refs.rows.filter((r) => r.role === role && r.position_id === positionId).map(toAyah);

  // Each main passage with the ayahs before and after it.
  const mainAyahs = refsOf("main");
  const main: MainPassage[] = [];
  for (const passage of passagesOf(mainAyahs.map((a) => a.address))) {
    const [before, after] = await Promise.all([
      ayahRange(passage.sura, Math.max(1, passage.from - CONTEXT_AYAHS), passage.from - 1),
      ayahRange(passage.sura, passage.to + 1, passage.to + CONTEXT_AYAHS),
    ]);
    main.push({
      ...passage,
      ayahs: mainAyahs.filter((a) => a.sura === passage.sura && a.ayah >= passage.from && a.ayah <= passage.to),
      before,
      after,
    });
  }

  const positions = await db().query(
    `SELECT p.id, p.side_id::int, x.title AS side, p.holder, p.recognition, p.text, p.source_note
     FROM topic_positions p
     JOIN position_sides s ON s.id = p.side_id
     JOIN position_side_texts x ON x.side_id = s.id AND x.locale = $2
     WHERE p.topic_id = $1 AND p.locale = $2 ORDER BY s.position, x.title, p.position`,
    [topic.id, LOCALE],
  );
  const sides: (PublicTopic["sides"][number] & { id: number })[] = [];
  for (const p of positions.rows) {
    const position: PublicPosition = {
      side: p.side,
      holder: p.holder,
      recognition: p.recognition,
      text: p.text,
      sourceNote: p.source_note,
      refs: refsOf("position", String(p.id)),
    };
    const group = sides.at(-1);
    if (group && group.id === p.side_id) group.positions.push(position);
    else sides.push({ id: p.side_id, title: p.side, positions: [position] });
  }

  const terms = await db().query(
    `SELECT t.slug, x.translation FROM topic_terms r
     JOIN terms t ON t.id = r.term_id AND t.status = 'published'
     JOIN term_texts x ON x.term_id = t.id AND x.locale = $2
     WHERE r.topic_id = $1 ORDER BY x.translation`,
    [topic.id, LOCALE],
  );
  const related = await db().query(
    `SELECT t.slug, x.title FROM topic_relations r
     JOIN topics t ON t.id = r.related_id AND t.status = 'published'
     JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $2
     WHERE r.topic_id = $1 ORDER BY x.title`,
    [topic.id, LOCALE],
  );

  return {
    ...topic,
    main,
    circumstancesRefs: refsOf("circumstances"),
    relatedRefs: refsOf("related"),
    sides: sides.map(({ title, positions }) => ({ title, positions })),
    terms: terms.rows,
    related: related.rows,
  };
}
