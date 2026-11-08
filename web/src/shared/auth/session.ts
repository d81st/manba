import { createHmac, timingSafeEqual } from "node:crypto";

// Sessions. The main administrator logs in with the login and password from
// the server settings (SITE_LOGIN/SITE_PASSWORD); other people have accounts in
// the users table (migration 043, lib/users.ts) with the role admin or reader.

export const SESSION_COOKIE = "manba_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // seconds

// Set only by the admin preview action. A ?drafts=1 link alone does not open drafts.
export const PREVIEW_COOKIE = "manba_preview";
export const PREVIEW_MAX_AGE = 60 * 60 * 12; // seconds

export type Role = "admin" | "reader";

// uid/ver/pc only for accounts in the users table: the account id, its
// session_version (checked against the database on every request) and
// "must change the temporary password".
export type Session = { login: string; exp: number; role: Role; uid?: number; ver?: number; pc?: boolean };
export type Account = { role: Role; uid: number; ver: number; pc: boolean };

export function isConfigured() {
  return Boolean(
    process.env.SITE_LOGIN &&
      process.env.SITE_PASSWORD &&
      process.env.SESSION_SECRET,
  );
}

// Signing with the password too means changing it signs everyone out.
function signingKey() {
  if (!isConfigured()) return null;
  return `${process.env.SESSION_SECRET}:${process.env.SITE_PASSWORD}`;
}

function sign(data: string, key: string) {
  return createHmac("sha256", key).update(data).digest("base64url");
}

// Hash first so strings of different length still compare in constant time.
function safeEqual(a: string, b: string) {
  const digest = (value: string) =>
    createHmac("sha256", "compare").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function credentialsMatch(login: string, password: string) {
  if (!isConfigured()) return false;
  // Check both so the timing does not reveal which one is wrong.
  const loginOk = safeEqual(login, process.env.SITE_LOGIN!);
  const passwordOk = safeEqual(password, process.env.SITE_PASSWORD!);
  return loginOk && passwordOk;
}

export function createSessionToken(login: string, account?: Account) {
  const key = signingKey();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const session: Session = account
    ? { login, exp, role: account.role, uid: account.uid, ver: account.ver, ...(account.pc ? { pc: true } : {}) }
    : { login, exp, role: "admin" };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function createPreviewToken(now = Date.now()) {
  const key = signingKey();
  if (!key) return null;
  const exp = Math.floor(now / 1000) + PREVIEW_MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ kind: "preview", exp })).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function readPreviewToken(token: string | undefined, now = Date.now()): { exp: number } | null {
  const key = signingKey();
  if (!key || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, key))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { kind?: string; exp?: number };
    if (parsed.kind !== "preview" || typeof parsed.exp !== "number" || parsed.exp <= now / 1000) return null;
    return { exp: parsed.exp };
  } catch {
    return null;
  }
}

export function readSessionToken(token: string | undefined): Session | null {
  const key = signingKey();
  if (!key || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, key))) {
    return null;
  }
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<Session>;
    if (typeof session.login !== "string" || typeof session.exp !== "number") return null;
    if (session.exp <= Date.now() / 1000) return null;
    if (session.uid !== undefined) {
      if (!Number.isInteger(session.uid) || !Number.isInteger(session.ver)) return null;
      if (session.role !== "admin" && session.role !== "reader") return null;
      return session as Session;
    }
    // The main administrator. Tokens issued before roles existed carry no role.
    if (session.login !== process.env.SITE_LOGIN) return null;
    return { login: session.login, exp: session.exp, role: "admin" };
  } catch {
    return null;
  }
}
