import "server-only";
import { searchKey } from "@/lib/arabic";
import { db } from "@/lib/db";
import { plainKey } from "@/lib/plain-key";
import { type Analysis, namesMatch, stemRu } from "../assistant.analysis";
import type { Concept } from "../assistant.types";
import { LOCALE } from "./assistant.sql";

// The subjects of the question, widened by the glossary (Russian name or
// transliteration -> Arabic) and the moderator's synonyms.
export async function concepts(analysis: Analysis): Promise<{ concepts: Concept[]; terms: { slug: string; title: string; index: number }[] }> {
  const list: Concept[] = analysis.words.map((w) =>
    w.script === "ar" ? { label: w.text, ar: [w.key], ru: [], from: [] } : { label: w.text, ar: [], ru: [w.key], from: [] },
  );
  const terms: { slug: string; title: string; index: number }[] = [];
  if (analysis.words.length === 0) return { concepts: list, terms };
  const [termRows, synonymRows] = await Promise.all([
    db().query<{ slug: string; arabic: string; translit: string; title: string }>(
      `SELECT m.slug, m.arabic, m.transliteration AS translit, x.translation AS title
       FROM terms m JOIN term_texts x ON x.term_id = m.id AND x.locale = $1 WHERE m.status = 'published'`,
      [LOCALE],
    ),
    db().query<{ phrase: string; forms: string[] }>("SELECT phrase, forms FROM assistant_synonyms"),
  ]);
  const at = (name: string) => {
    // The concept of the first question word that the name matches.
    const i = analysis.words.findIndex((w) => namesMatch(name, [w]));
    return i >= 0 ? i : analysis.words.findIndex(() => namesMatch(name, analysis.words));
  };
  for (const term of termRows.rows) {
    const arKey = searchKey(term.arabic);
    let i = [term.title, term.translit].map(at).find((x) => x >= 0) ?? -1;
    if (i < 0) i = analysis.words.findIndex((w) => w.script === "ar" && w.key.length >= 3 && arKey.includes(w.key));
    if (i < 0) continue;
    if (arKey.length >= 3 && !list[i].ar.includes(arKey)) list[i].ar.push(arKey);
    list[i].from.push(`term:${term.slug}`);
    terms.push({ slug: term.slug, title: term.title, index: i });
  }
  for (const synonym of synonymRows.rows) {
    const i = at(synonym.phrase);
    if (i < 0) continue;
    for (const form of synonym.forms) {
      if (/[؀-ۿ]/.test(form)) {
        const key = searchKey(form);
        if (key.length >= 3 && !list[i].ar.includes(key)) list[i].ar.push(key);
      } else {
        for (const word of plainKey(form).split(" ").filter((w) => w.length >= 3)) {
          const stem = stemRu(word);
          if (!list[i].ru.includes(stem)) list[i].ru.push(stem);
        }
      }
    }
  }
  return { concepts: list, terms };
}
