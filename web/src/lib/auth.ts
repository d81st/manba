import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE, type Session } from "@/lib/session";

// Check the session close to the data, not only in the proxy.
export async function requireSession(): Promise<Session> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) redirect("/login");
  return session;
}
