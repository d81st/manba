// Marks the words two texts share, the way similar texts are found
// (data/sources/links/README.md): a word is marked when it and the next word
// form a pair of words that the other text also has. No database here.
import { searchKey } from "./arabic.ts";

export type Piece = { text: string; shared: boolean };

const NOT_LETTER = /[^ء-ي]/g;

// Words with their search form ("" for punctuation), spaces kept between them.
function tokens(text: string) {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) => ({ part, key: /^\s+$/.test(part) ? null : searchKey(part).replace(NOT_LETTER, "") }));
}

function pairs(text: string) {
  const keys = tokens(text).flatMap((t) => (t.key ? [t.key] : []));
  return new Set(keys.slice(1).map((key, i) => `${keys[i]} ${key}`));
}

// Pieces of `text` in order: runs of shared words and of the rest, with the
// text rebuilt exactly. A space is shared when the words on both sides are.
export function markShared(text: string, other: string): Piece[] {
  const own = tokens(text);
  const otherPairs = pairs(other);
  const shared = own.map(() => false);
  const words = own.flatMap((t, i) => (t.key ? [i] : []));
  for (let k = 0; k + 1 < words.length; k++) {
    if (otherPairs.has(`${own[words[k]].key} ${own[words[k + 1]].key}`)) {
      shared[words[k]] = true;
      shared[words[k + 1]] = true;
    }
  }
  own.forEach((t, i) => {
    if (t.key === null && shared[i - 1] && shared[i + 1]) shared[i] = true;
  });
  const pieces: Piece[] = [];
  own.forEach((t, i) => {
    const last = pieces.at(-1);
    if (last && last.shared === shared[i]) last.text += t.part;
    else pieces.push({ text: t.part, shared: shared[i] });
  });
  return pieces;
}
