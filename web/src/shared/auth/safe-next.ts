// Accept only same-site relative paths to avoid open redirects. A path is
// checked again after decoding, twice, so "%2F%2F" and "%252F%252F" cannot
// become a protocol-relative address.
export function safeNext(next: unknown, fallback = "/") {
  if (typeof next !== "string") return fallback;
  let path = next;
  for (let i = 0; i < 3; i++) {
    if (!isSitePath(path)) return fallback;
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) return next;
      path = decoded;
    } catch {
      return fallback;
    }
  }
  return isSitePath(path) ? next : fallback;
}

function isSitePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return false;
  return !/[\u0000-\u001f\u007f\\]/.test(path);
}
