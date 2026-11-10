import "server-only";
import { cacheLife } from "next/cache";
import { db } from "@/shared/db";
import type { BookCount } from "../assistant.types";
import { like } from "./assistant.sql";

// The other books of the library (commentary, the Prophet's life, history,
// theology, sciences): for each subject of the question with an Arabic form,
// the books whose text has it and in how many fragments. The fragments
// themselves are read in the search of that book, where the link leads.
// These books are outside the trigram index (migration 021), so their text is
// read through once for the whole question; the page shows this part after
// the rest, and the answer is kept for a day.
const CATEGORIES = ["sira", "tafsir", "qiraat", "history", "sciences", "theology"];
const PER_SUBJECT = 6;

// forms[i] — the Arabic search forms of the i-th subject (empty: not searched).
export async function bookCounts(forms: string[][]): Promise<BookCount[]> {
  "use cache";
  cacheLife("days");
  const params: unknown[] = [CATEGORIES];
  const subjects = forms.flatMap((list, concept) => {
    if (list.length === 0) return [];
    const sql = list.map((form) => `t.search_plain LIKE $${params.push(like(form))}`).join(" OR ");
    return [{ concept, sql: `(${sql})`, word: list[0] }];
  });
  if (subjects.length === 0) return [];
  const counts = subjects.map((s, i) => `count(*) FILTER (WHERE ${s.sql})::int AS c${i}`).join(", ");
  const { rows } = await db().query<{ work: string; title: string } & Record<string, number>>(
    `SELECT w.id AS work, coalesce(w.titles->>'ru-short', w.titles->>'ru') AS title, ${counts}
     FROM texts t
     JOIN text_versions v ON v.id = t.version_id AND v.status = 'published' AND v.is_primary AND v.language = 'ar'
     JOIN works w ON w.id = v.work_id AND w.status = 'published'
     WHERE w.category = ANY($1::text[]) AND (${subjects.map((s) => s.sql).join(" OR ")})
     GROUP BY w.id`,
    params,
  );
  return subjects.flatMap((s, i) =>
    rows
      .map((r) => ({ work: r.work, title: r.title, count: r[`c${i}`], concept: s.concept }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count || a.work.localeCompare(b.work))
      .slice(0, PER_SUBJECT)
      // The search of a book takes one word: the first Arabic form of the subject.
      .map((r) => ({ ...r, href: `/library/${r.work}/search?q=${encodeURIComponent(s.word)}` })),
  );
}
