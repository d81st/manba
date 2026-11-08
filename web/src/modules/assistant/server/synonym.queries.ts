import "server-only";
import { db } from "@/shared/db";
import type { Synonym } from "../assistant.types";

export async function listSynonyms(): Promise<Synonym[]> {
  const { rows } = await db().query<Synonym>("SELECT id::int, phrase, forms, note FROM assistant_synonyms ORDER BY phrase");
  return rows;
}

export async function listMisses(): Promise<{ words: string; count: number; lastMonth: string }[]> {
  const { rows } = await db().query(
    `SELECT words, count, to_char(last_month, 'MM.YYYY') AS "lastMonth" FROM assistant_misses ORDER BY count DESC, words LIMIT 100`,
  );
  return rows;
}
