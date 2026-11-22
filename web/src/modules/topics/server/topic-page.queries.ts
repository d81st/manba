import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { CONTEXT_AYAHS, TOPICS_TAG } from "../topic.constants";
import { passagesOf } from "../topic.passages";
import type { MainPassage, PublicPosition, PublicTopic, QuoteLinks, TopicAyah, TopicPlace, TopicSummary, TopicVersions } from "../topic.types";
import { LOCALE, SUMMARY, type RefRole } from "./topic.sql";
import { getEventsForTopic, getSiraData } from "@/modules/sira/server";
import type { SiraPlace } from "@/modules/sira";
import { getHadithRefs } from "@/modules/hadith/server";
import { bookPath, formatBookRef, isBook } from "@/shared/addresses/book-query";
import { formatHadithRef, hadithPath } from "@/shared/addresses/hadith-query";
import { arabicQuotes, withHighlight } from "@/shared/content/quote-match";

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

// The page of a fragment: an ayah, a page of a book, a hadith.
function fragmentHref(address: string): string {
  const [work, ...rest] = address.split(".");
  const path = rest.map(Number);
  if (work === "quran") return `/quran/${path[0]}#${path[0]}-${path[1]}`;
  return isBook(work) ? bookPath(work, path) : hadithPath(work, path);
}

// For every Arabic quotation of each text, the first of its addresses whose
// (descendants are found through addresses, whose GiST index serves <@)
// primary Arabic text contains it word for word; a quotation found nowhere
// stays plain text.
async function quoteLinks(items: { text: string; addresses: string[] }[]): Promise<QuoteLinks[]> {
  const rows = items.flatMap((item, i) =>
    item.addresses.length ? arabicQuotes(item.text).map((quote) => ({ i, quote, addrs: item.addresses })) : [],
  );
  const links: QuoteLinks[] = items.map(() => ({}));
  if (!rows.length) return links;
  const found = await db().query<{ i: number; quote: string; address: string | null }>(
    `SELECT q.i, q.quote,
            (SELECT x.address::text
             FROM unnest(q.addrs) WITH ORDINALITY AS u(ad, k)
             JOIN addresses a ON a.address <@ u.ad::extensions.ltree
             JOIN texts x ON x.address = a.address
             JOIN text_versions v ON v.id = x.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
             WHERE position(q.quote IN x.content) > 0
             ORDER BY u.k, a.ordinal
             LIMIT 1) AS address
     FROM jsonb_to_recordset($1::jsonb) AS q(i int, quote text, addrs text[])`,
    [JSON.stringify(rows)],
  );
  for (const row of found.rows) {
    if (row.address) links[row.i][row.quote] = withHighlight(fragmentHref(row.address), row.quote);
  }
  return links;
}

function fragmentLabel(address: string): string {
  const [work, ...rest] = address.split(".");
  if (work === "quran") return rest.slice(0, 2).join(":");
  return isBook(work) ? formatBookRef(address) : formatHadithRef(address);
}

// The table of points where the reports disagree. A cell shows only while its
// quotation stands in the text of its position and in its fragment; a column
// is a position with at least one such cell, in the order of the page.
async function topicVersions(topicId: number, sides: PublicTopic["sides"]): Promise<TopicVersions | null> {
  const { rows } = await db().query<{ point: string; label: string; holder: string | null; quote: string | null; address: string | null }>(
    `SELECT p.id::text AS point, p.label, c.holder, c.quote, c.address::text
     FROM topic_version_points p
     LEFT JOIN topic_version_cells c ON c.point_id = p.id
       AND EXISTS (SELECT 1 FROM topic_positions tp
                   WHERE tp.topic_id = p.topic_id AND tp.locale = p.locale AND tp.holder = c.holder
                     AND position(c.quote IN tp.text) > 0)
       AND EXISTS (SELECT 1 FROM addresses a
                   JOIN texts x ON x.address = a.address
                   JOIN text_versions v ON v.id = x.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
                   WHERE a.address <@ c.address AND position(c.quote IN x.content) > 0)
     WHERE p.topic_id = $1 AND p.locale = $2
     ORDER BY p.position, p.id`,
    [topicId, LOCALE],
  );
  const holders = new Set(rows.flatMap((r) => (r.holder ? [r.holder] : [])));
  const columns = sides.flatMap((side, i) =>
    side.positions.flatMap((position, j) => (holders.has(position.holder) ? [{ holder: position.holder, anchor: `position-${i}-${j}` }] : [])),
  );
  if (columns.length < 2) return null;
  const points = new Map<string, { label: string; cells: Map<string, { quote: string; address: string }> }>();
  for (const row of rows) {
    const point = points.get(row.point) ?? { label: row.label, cells: new Map() };
    if (row.holder && row.quote && row.address) point.cells.set(row.holder, { quote: row.quote, address: row.address });
    points.set(row.point, point);
  }
  return {
    columns,
    rows: [...points.values()]
      .filter((point) => point.cells.size > 0)
      .map((point) => ({
        label: point.label,
        cells: columns.map(({ holder }) => {
          const cell = point.cells.get(holder);
          return cell ? { quote: cell.quote, href: withHighlight(fragmentHref(cell.address), cell.quote), ref: fragmentLabel(cell.address) } : null;
        }),
      })),
  };
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
  const positionItems: { position: PublicPosition; addresses: string[] }[] = [];
  for (const p of positions.rows) {
    const position: PublicPosition = {
      side: p.side,
      holder: p.holder,
      recognition: p.recognition,
      text: p.text,
      sourceNote: p.source_note,
      refs: refsOf("position", String(p.id)),
      hadiths: hadithsOf("position", String(p.id)),
      quotes: {},
    };
    positionItems.push({ position, addresses: refsFor("position", String(p.id)) });
    const group = sides.at(-1);
    if (group && group.id === p.side_id) group.positions.push(position);
    else sides.push({ id: p.side_id, title: p.side, positions: [position] });
  }

  const [circumstancesQuotes, ...positionQuotes] = await quoteLinks([
    { text: topic.circumstances, addresses: [...refsFor("circumstances", null), ...refsFor("main", null)] },
    ...positionItems.map(({ position, addresses }) => ({ text: position.text, addresses })),
  ]);
  positionItems.forEach(({ position }, k) => (position.quotes = positionQuotes[k]));

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

  const publicSides = sides.map(({ title, positions }) => ({ title, positions }));
  const [versions, events, places] = await Promise.all([
    topicVersions(topic.id, publicSides),
    getEventsForTopic(topic.id, drafts),
    db().query<SiraPlace>(
      `SELECT p.id::int, p.slug, coalesce(x.name, p.slug) AS name, p.name_ar AS "nameAr", p.lat, p.lon,
              p.coord_source AS "coordSource"
       FROM topic_places tp JOIN places p ON p.id = tp.place_id
       LEFT JOIN place_texts x ON x.place_id = p.id AND x.locale = $2
       WHERE tp.topic_id = $1 ORDER BY p.lon NULLS LAST, p.slug`,
      [topic.id, LOCALE],
    ),
  ]);

  return {
    ...topic,
    main,
    mainHadiths: hadithsOf("main"),
    circumstancesRefs: refsOf("circumstances"),
    circumstancesHadiths: hadithsOf("circumstances"),
    circumstancesQuotes,
    versions,
    events,
    places: places.rows,
    relatedRefs: refsOf("related"),
    relatedHadiths: hadithsOf("related"),
    sides: publicSides,
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
