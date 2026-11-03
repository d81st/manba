import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE, type Session } from "@/lib/session";

// The expiry check reads the clock: always at request time, never prerendered.
async function sessionFromCookie(): Promise<Session | null> {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSessionToken(token);
}

// Check the session close to the data, not only in the proxy.
export async function getSession(): Promise<Session | null> {
  return sessionFromCookie();
}

export async function requireSession(): Promise<Session> {
  const session = await sessionFromCookie();
  if (!session) redirect("/login");
  return session;
}
