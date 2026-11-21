import { canSee, positiveId } from "@/modules/debates";
import { debateExport } from "@/modules/debates/server";
import { getSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";

// The claims and the moderator's checks, for anyone who may already read the debate.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = positiveId((await context.params).id);
  if (!id || !isDatabaseConfigured()) return Response.json({ error: "bad_request" }, { status: 400 });
  const data = await debateExport(id);
  if (!data || !canSee({ status: data.status, createdBy: data.participants[0], partner: data.participants[1] }, session)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="debate-${id}.json"`,
      "cache-control": "no-store",
    },
  });
}
