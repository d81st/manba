// The level of a question: from the authority of the works its fragments come from,
// kept separately for the Sunni and Shia canons (the Quran is 1 for both).

// The level of a question: the highest authority (the smallest number) of its
// fragments, in each canon; null when no fragment has a level there.
export function questionLevel(works: { sunni: number | null; shia: number | null }[]) {
  const best = (values: (number | null)[]) => {
    const known = values.filter((v): v is number => v !== null);
    return known.length ? Math.min(...known) : null;
  };
  return { sunni: best(works.map((w) => w.sunni)), shia: best(works.map((w) => w.shia)) };
}

// One number to filter by: the better of the two canons.
export function levelKey(level: { sunni: number | null; shia: number | null }) {
  const known = [level.sunni, level.shia].filter((v): v is number => v !== null);
  return known.length ? Math.min(...known) : null;
}
