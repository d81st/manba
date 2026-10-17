import type { NextRequest } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { getAyahs } from "@/lib/quran";

// One ayah for the map card: GET /api/quran/ayah?a=2:255 (behind login, see proxy).
export async function GET(request: NextRequest) {
  const match = request.nextUrl.searchParams.get("a")?.match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match || !isDatabaseConfigured()) return Response.json({ error: "bad_request" }, { status: 400 });
  const result = await getAyahs(Number(match[1]), Number(match[2]), Number(match[2]));
  const hit = result.hits[0];
  if (!hit) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ address: `${hit.sura}:${hit.ayah}`, suraName: hit.suraName, text: hit.text });
}
