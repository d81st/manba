import type { NextRequest } from "next/server";
import { getSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { COLLECTIONS } from "@/shared/addresses/hadith-query";
import { similarNetwork } from "@/modules/hadith/server";
import { acquireHeavyForSession } from "@/shared/load-session";

// The graph of similar texts around a hadith: GET /api/hadith/similar?a=bukhari.1.
export async function GET(request: NextRequest) {
  if (!(await getSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const address = request.nextUrl.searchParams.get("a") ?? "";
  const match = /^([a-z_]+)(\.\d{1,6}){1,3}$/.exec(address);
  if (!match || !COLLECTIONS[match[1]] || !isDatabaseConfigured()) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const release = await acquireHeavyForSession();
  if (!release) return Response.json({ error: "busy" }, { status: 429 });
  const graph = await similarNetwork(address).finally(release);
  return graph ? Response.json(graph) : Response.json({ error: "not_found" }, { status: 404 });
}
