// Search form of a text of another religion (Hebrew, Greek, Russian): lower
// case, no vowel points, accents or cantillation; letters, digits and single
// spaces. No imports: the import script loads it under plain Node.
export function plainKey(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
