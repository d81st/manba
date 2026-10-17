import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE, type Session } from "@/lib/session";

// Check the session close to the data, not only in the proxy.
export async function requireSession(): Promise<Session> {
  // The expiry check reads the clock: always at request time, never prerendered.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) redirect("/login");
  return session;
}
