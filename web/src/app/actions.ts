"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endOwnerSessions } from "@/shared/auth/accounts";
import { readSessionToken, SESSION_COOKIE } from "@/shared/auth/session";

// Signing out removes the cookie; for the main administrator it also ends
// every session of theirs, so a copied cookie stops working (migration 050).
export async function signOut() {
  const store = await cookies();
  const session = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (session && !session.uid) await endOwnerSessions();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
