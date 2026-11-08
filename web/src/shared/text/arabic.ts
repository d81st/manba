// Arabic text normalization for search.
//
// Source texts are stored exactly as published (licenses such as Tanzil's
// forbid changes). These functions only build derived search forms:
//   searchKey(text)                 letters only: no diacritics, folded variants
//   searchKey(text, { diacritics }) the same, but vowel marks are kept
// A query is matched against the stored search form of the same kind.

// Harakat, tanwin, shadda, sukun, superscript (dagger) alef, Quranic
// annotation signs and small high letters, extended Arabic marks.
const DIACRITICS =
  /[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣣ࣡-ࣿ]/g;
// Quranic annotation signs and small letters: dropped even when vowels are kept.
const ANNOTATIONS = /[ؐ-ؚۖ-ۭ࣓-ࣣ࣡-ࣿ]/g;
const TATWEEL = /ـ/g;
// Zero-width joiners and bidirectional controls.
const INVISIBLE = /[​-‏‪-‮⁦-⁩﻿]/g;

const LETTER_FOLDS: Record<string, string> = {
  "آ": "ا", // alef with madda -> alef
  "أ": "ا", // alef with hamza above -> alef
  "إ": "ا", // alef with hamza below -> alef
  "ٱ": "ا", // alef wasla -> alef
  "ٲ": "ا", // alef with wavy hamza above -> alef
  "ٳ": "ا", // alef with wavy hamza below -> alef
  "ى": "ي", // alef maksura -> yeh
  "ة": "ه", // teh marbuta -> heh
  "ک": "ك", // Persian keheh -> kaf
  "ی": "ي", // Farsi yeh -> yeh
};
const FOLDABLE = new RegExp(`[${Object.keys(LETTER_FOLDS).join("")}]`, "g");

// Arabic-Indic and Extended Arabic-Indic digits -> ASCII digits.
const DIGITS = /[٠-٩۰-۹]/g;

export function hasDiacritics(text: string) {
  return new RegExp(DIACRITICS.source).test(text);
}

export function stripDiacritics(text: string) {
  return text.normalize("NFC").replace(DIACRITICS, "");
}

export function searchKey(
  text: string,
  options: { diacritics?: boolean } = {},
) {
  // NFKC turns presentation forms and ligatures into plain letters.
  let result = text.normalize("NFKC").replace(INVISIBLE, "").replace(TATWEEL, "");
  result = options.diacritics
    ? result.replace(ANNOTATIONS, "")
    : result.replace(DIACRITICS, "");
  return result
    .replace(FOLDABLE, (letter) => LETTER_FOLDS[letter])
    .replace(DIGITS, (digit) => {
      const code = digit.charCodeAt(0);
      return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
    })
    .replace(/\s+/g, " ")
    .trim();
}
