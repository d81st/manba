// A quotation from a topic page and the place it comes from: the topic links
// the Arabic words in guillemets to the fragment they were found in, and the
// fragment's page marks the same words (quote-highlight.tsx). Pure functions,
// unit-tested; no database and no DOM here.

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

// The Arabic quotations of a text: what stands between « and », in order, once each.
export function arabicQuotes(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/«([^«»]+)»/g)) {
    if (ARABIC.test(m[1]) && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

export const HIGHLIGHT_PARAM = "hl";
const MAX_QUOTE = 400;

// The same link with the words to mark: "/library/x/s/2?page=3#p-1" ->
// "/library/x/s/2?page=3&hl=…#p-1". A long quotation is cut: its start finds the place.
export function withHighlight(href: string, quote: string): string {
  const [path, anchor] = href.split("#", 2);
  const words = encodeURIComponent(quote.slice(0, MAX_QUOTE));
  return `${path}${path.includes("?") ? "&" : "?"}${HIGHLIGHT_PARAM}=${words}${anchor ? `#${anchor}` : ""}`;
}

// Where the words stand in a run of text pieces (the text nodes of a page,
// in order). Spaces and line breaks are left out on both sides, so words cut
// over lines or elements are still found.
export type QuoteSpan = { start: { piece: number; offset: number }; end: { piece: number; offset: number } };

export function findQuote(pieces: string[], quote: string): QuoteSpan | null {
  const needle = quote.replace(/\s+/g, "");
  if (!needle) return null;
  let joined = "";
  const where: { piece: number; offset: number }[] = [];
  pieces.forEach((text, piece) => {
    for (let offset = 0; offset < text.length; offset++) {
      if (/\s/.test(text[offset])) continue;
      joined += text[offset];
      where.push({ piece, offset });
    }
  });
  const at = joined.indexOf(needle);
  if (at < 0) return null;
  const last = where[at + needle.length - 1];
  return { start: where[at], end: { piece: last.piece, offset: last.offset + 1 } };
}
