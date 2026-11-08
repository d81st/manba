import type { NextRequest } from "next/server";
import { getSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { storyThread } from "@/modules/quran/server";
import { storyBySlug } from "@/modules/quran";

// The ayahs of a story thread for the map: GET /api/quran/thread?story=musa.
export async function GET(request: NextRequest) {
  if (!(await getSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const story = storyBySlug(request.nextUrl.searchParams.get("story") ?? "");
  if (!story || !isDatabaseConfigured()) return Response.json({ error: "bad_request" }, { status: 400 });
  return Response.json(await storyThread(story));
}
