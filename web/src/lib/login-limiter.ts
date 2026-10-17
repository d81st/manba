// Brute-force protection for the login form. In memory, per server instance:
// enough for the single small Render instance used during development.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ADDRESS = 10;
// Addresses can be rotated, so also cap failures from everywhere together.
const MAX_TOTAL = 50;
const TOTAL = "*";

const failures = new Map<string, { count: number; since: number }>();

function current(key: string, now: number) {
  const entry = failures.get(key);
  if (entry && now - entry.since > WINDOW_MS) {
    failures.delete(key);
    return undefined;
  }
  return entry;
}

export function isLocked(address: string, now = Date.now()) {
  return (
    (current(address, now)?.count ?? 0) >= MAX_PER_ADDRESS ||
    (current(TOTAL, now)?.count ?? 0) >= MAX_TOTAL
  );
}

export function recordFailure(address: string, now = Date.now()) {
  for (const key of [address, TOTAL]) {
    const entry = current(key, now);
    if (entry) entry.count += 1;
    else failures.set(key, { count: 1, since: now });
  }
  if (failures.size > 10_000) {
    for (const key of failures.keys()) current(key, now);
  }
}

export function recordSuccess(address: string) {
  failures.delete(address);
}
