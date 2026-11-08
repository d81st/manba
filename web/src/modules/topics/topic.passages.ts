// Consecutive ayahs of one sura, so a passage can be shown with the ayahs around it.
export type Passage = { sura: number; from: number; to: number };

export function passagesOf(addresses: string[]): Passage[] {
  const passages: Passage[] = [];
  for (const address of addresses) {
    const [, sura, ayah] = address.split(".").map(Number);
    const last = passages.at(-1);
    if (last && last.sura === sura && last.to + 1 === ayah) last.to = ayah;
    else passages.push({ sura, from: ayah, to: ayah });
  }
  return passages;
}
