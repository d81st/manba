import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { FINDINGS_TAG } from "../finding.constants";
import type { Finding } from "../finding.types";
import { COLUMNS } from "./finding.sql";

export async function listFindings(status?: string): Promise<Finding[]> {
  const { rows } = await db().query<Finding>(
    `SELECT ${COLUMNS} FROM findings WHERE ($1::text IS NULL OR status = $1) ORDER BY id DESC`,
    [status ?? null],
  );
  return rows;
}

export async function getFinding(id: number): Promise<Finding | null> {
  const { rows } = await db().query<Finding>(`SELECT ${COLUMNS} FROM findings WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

// The public section: checked leads whose text is not in the source named.
export async function listPublicNotFound(): Promise<Finding[]> {
  "use cache";
  cacheTag(FINDINGS_TAG);
  cacheLife("hours");
  const { rows } = await db().query<Finding>(`SELECT ${COLUMNS} FROM findings WHERE public AND status = 'not_found' ORDER BY updated_at DESC`);
  return rows;
}
