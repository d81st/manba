// Markup of a translation's text (data/sources/sablukov/README.md):
// {words} - words the translator added (italic in the edition, not in the
// original), [[note]] - the translator's footnote. Everything else is text.
export type TranslationPiece = { kind: "text" | "added" | "note"; text: string };

export function parseTranslation(content: string): TranslationPiece[] {
  const pieces: TranslationPiece[] = [];
  const push = (kind: TranslationPiece["kind"], text: string) => {
    if (!text) return;
    const last = pieces.at(-1);
    if (last && last.kind === kind && kind !== "note") last.text += text;
    else pieces.push({ kind, text });
  };
  let i = 0;
  while (i < content.length) {
    if (content.startsWith("[[", i)) {
      const end = content.indexOf("]]", i + 2);
      if (end > 0) {
        push("note", content.slice(i + 2, end).trim());
        i = end + 2;
        continue;
      }
    }
    if (content[i] === "{") {
      const end = content.indexOf("}", i + 1);
      if (end > 0) {
        push("added", content.slice(i + 1, end));
        i = end + 1;
        continue;
      }
    }
    const next = [content.indexOf("[[", i + 1), content.indexOf("{", i + 1)].filter((x) => x > 0);
    const stop = next.length ? Math.min(...next) : content.length;
    push("text", content.slice(i, stop));
    i = stop;
  }
  return pieces;
}

// The text without markup: added words kept, notes left out.
export function translationPlain(content: string) {
  return parseTranslation(content)
    .filter((p) => p.kind !== "note")
    .map((p) => p.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
