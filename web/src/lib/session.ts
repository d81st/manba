import { createHmac, timingSafeEqual } from "node:crypto";

// Temporary development gate: one shared login and password from environment
// variables. Replaced by real user accounts later.

export const SESSION_COOKIE = "manba_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // seconds

export type Session = { login: string; exp: number };

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

export function createSessionToken(login: string) {
  const key = signingKey();
  if (!key) return null;
  const session: Session = {
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function readSessionToken(token: string | undefined): Session | null {
  const key = signingKey();
  if (!key || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, key))) {
    return null;
  }
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Session;
    return session.exp > Date.now() / 1000 ? session : null;
  } catch {
    return null;
  }
}
