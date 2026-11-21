const MAX_NEXT = 2000;

// Accept only same-site relative paths to avoid open redirects. A path is
// checked again after each decoding, up to several times, so a repeatedly
// encoded "%2F%2F" cannot become a protocol-relative address. A path that is
// still encoded after that is refused. A path of this site is returned as given.
export function safeNext(next: unknown, fallback = "/") {
  if (typeof next !== "string" || next.length > MAX_NEXT) return fallback;
  let path = next;
  for (let i = 0; i < 8; i++) {
    if (!isSitePath(path)) return fallback;
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) return next;
      path = decoded;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function isSitePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return false;
  return !/[\u0000-\u001f\u007f\\]/.test(path);
}
