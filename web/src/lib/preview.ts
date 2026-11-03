import "server-only";
import { cookies } from "next/headers";
import { PREVIEW_COOKIE, readPreviewToken } from "@/lib/session";

// Drafts are shown only when the page asks (?drafts=1) and the admin preview
// action has set a signed cookie. A shared link with the query alone does not.
export async function isPreview(params: Record<string, string | string[] | undefined>) {
  const flag = params.drafts;
  const asked = flag === "1" || (Array.isArray(flag) && flag.includes("1"));
  if (!asked) return false;
  const token = (await cookies()).get(PREVIEW_COOKIE)?.value;
  return readPreviewToken(token) !== null;
}
