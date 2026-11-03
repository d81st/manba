// Adds drafts=1 without dropping a hash or an existing query.
export function withDrafts(path: string) {
  const hashAt = path.indexOf("#");
  const hash = hashAt >= 0 ? path.slice(hashAt) : "";
  const before = hashAt >= 0 ? path.slice(0, hashAt) : path;
  if (/(?:^|[?&])drafts=1(?:&|$)/.test(before)) return path;
  return `${before}${before.includes("?") ? "&" : "?"}drafts=1${hash}`;
}
