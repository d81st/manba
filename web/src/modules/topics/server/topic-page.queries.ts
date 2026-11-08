import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { CONTEXT_AYAHS, TOPICS_TAG } from "../topic.constants";
import { passagesOf } from "../topic.passages";
import type { MainPassage, PublicPosition, PublicTopic, TopicAyah, TopicPlace, TopicSummary } from "../topic.types";
import { LOCALE, SUMMARY, type RefRole } from "./topic.sql";
import { getSiraData } from "@/modules/sira/server";
import { getHadithRefs } from "@/modules/hadith/server";

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

export async function getPublishedTopic(slug: string, drafts = false): Promise<PublicTopic | null> {
  "use cache";
  cacheTag(TOPICS_TAG);
  cacheLife("hours");
  const statuses = drafts ? ["draft", "review", "published"] : ["published"];
  const summary = await db().query<TopicSummary & { circumstances: string; circumstancesNote: string }>(
    `SELECT s.*, x.circumstances, x.circumstances_note AS "circumstancesNote"
     FROM (${SUMMARY} WHERE t.slug = $1 AND t.status = ANY($2::text[])) s
     JOIN topic_texts x ON x.topic_id = s.id AND x.locale = '${LOCALE}'`,
    [slug, statuses],
  );
  const topic = summary.rows[0];
  if (!topic) return null;

  // Referenced ayahs with their text and sura name; hadiths with their texts.
  const refs = await db().query<{ role: RefRole; position_id: string | null; address: string }>(
    "SELECT role, position_id, address::text FROM topic_refs WHERE topic_id = $1 ORDER BY position",
    [topic.id],
  );
  const ayahRows = await db().query<AyahRow>(
    `SELECT a.address::text, t.content AS text, s.names->>'translit' AS sura_name
     FROM addresses a ${AYAH_TEXT}
     WHERE a.address = ANY($1::extensions.ltree[])`,
    [refs.rows.filter((r) => r.address.startsWith("quran.")).map((r) => r.address)],
  );
  const ayahs = new Map(ayahRows.rows.map((row) => [row.address, toAyah(row)]));
  const hadiths = await getHadithRefs([
    ...new Set(refs.rows.filter((r) => !r.address.startsWith("quran.")).map((r) => r.address)),
  ]);
  const refsFor = (role: RefRole, positionId: string | null) =>
    refs.rows.filter((r) => r.role === role && r.position_id === positionId).map((r) => r.address);
  const refsOf = (role: RefRole, positionId: string | null = null) =>
    refsFor(role, positionId).flatMap((address) => ayahs.get(address) ?? []);
  const hadithsOf = (role: RefRole, positionId: string | null = null) =>
    refsFor(role, positionId).flatMap((address) => hadiths.get(address) ?? []);

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
      hadiths: hadithsOf("position", String(p.id)),
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
    mainHadiths: hadithsOf("main"),
    circumstancesRefs: refsOf("circumstances"),
    circumstancesHadiths: hadithsOf("circumstances"),
    relatedRefs: refsOf("related"),
    relatedHadiths: hadithsOf("related"),
    sides: sides.map(({ title, positions }) => ({ title, positions })),
    terms: terms.rows,
    related: related.rows,
  };
}

// The city a topic is about and the published events of the Prophet's life there.
export async function getTopicPlace(slug: string): Promise<TopicPlace | null> {
  const { places, events } = await getSiraData(false);
  const place = places.find((p) => p.slug === slug);
  if (!place) return null;
  return { place, events: events.filter((e) => e.place === slug) };
}
