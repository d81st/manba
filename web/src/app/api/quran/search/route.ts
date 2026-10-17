import type { NextRequest } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { searchAddresses } from "@/lib/quran";
import { likePatterns, parseQuery } from "@/lib/quran-query";

// Ayahs to light up on the map: GET /api/quran/search?q=... -> { kind, addresses }.
export async function GET(request: NextRequest) {
  const parsed = parseQuery(request.nextUrl.searchParams.get("q") ?? "");
  if (parsed.kind === "text") {
    if (!isDatabaseConfigured()) return Response.json({ error: "no_database" }, { status: 503 });
    const addresses = await searchAddresses(likePatterns(parsed.words), parsed.diacritics);
    return Response.json({ kind: "text", addresses });
  }
  if (parsed.kind === "ayahs") {
    const addresses = [];
    for (let ayah = parsed.from; ayah <= parsed.to; ayah++) addresses.push(`${parsed.sura}:${ayah}`);
    return Response.json({ kind: "ayahs", addresses });
  }
  if (parsed.kind === "sura") return Response.json({ kind: "sura", sura: parsed.sura, addresses: [] });
  return Response.json({ kind: parsed.kind, addresses: [] });
}
