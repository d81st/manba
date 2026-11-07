import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE, type Session } from "@/lib/session";
import { accountState } from "@/lib/users";

// The expiry check reads the clock: always at request time, never prerendered.
async function sessionFromCookie(): Promise<Session | null> {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session?.uid) return session;
  // An account's role and disabling are read from the database, not trusted
  // from the cookie (the proxy checks the same before every page).
  const state = await accountState(session.uid);
  if (!state || state.disabled || state.session_version !== session.ver) return null;
  return { ...session, role: state.role };
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

// The admin panel, drafts and every admin action. A reader gets "not found",
// so the panel's addresses say nothing to them.
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "admin") notFound();
  return session;
}
