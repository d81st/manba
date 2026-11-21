import "server-only";
import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE } from "@/shared/auth/session";
import { acquireHeavy } from "./load";

// The signed-in login, or one shared bucket when the cookie is missing.
export async function acquireHeavyForSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return acquireHeavy(readSessionToken(token)?.login ?? "anonymous");
}
