// Thresholds for the login form. Counting happens in the database
// (login-lockout.ts); this file only decides and reads the client address.

export const WINDOW_MS = 15 * 60 * 1000;

// Same login from one address, and the same login from anywhere.
export const MAX_PAIR = 10;
export const MAX_LOGIN = 10;
// One address, any login: high enough that a shared office address is not
// locked by a few mistakes on another account.
export const MAX_ADDRESS = 30;
// Every failure together, so rotating both the address and the login still stops.
export const MAX_TOTAL = 50;

export type FailureCounts = {
  pair: number;
  login: number;
  address: number;
  total: number;
};

export function isLocked(counts: FailureCounts) {
  return (
    counts.pair >= MAX_PAIR ||
    counts.login >= MAX_LOGIN ||
    counts.address >= MAX_ADDRESS ||
    counts.total >= MAX_TOTAL
  );
}

// The platform appends the real client address at the end of X-Forwarded-For.
// The first value is whatever the client sent, so it is not the address.
export function clientAddress(forwarded: string | null | undefined, realIp?: string | null) {
  const hops = (forwarded ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (hops.length > 0) return hops[hops.length - 1];
  const real = realIp?.trim();
  return real || "local";
}
