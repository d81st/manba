// Heavy reads (a text search, the assistant, a similarity graph) share the
// database pool with every page. Two at a time, and only one per person, so a
// few repeated searches do not keep the other readers waiting. Counting is in
// this process: the free host runs one. No database here, so it is unit-tested.

export const HEAVY_AT_ONCE = 2;
export const HEAVY_PER_PERSON = 1;

const slot = { total: 0, byOwner: new Map<string, number>() };

// Returns a function that frees the slot, or null when the person or the
// process is already at the limit. Calling the function twice frees it once.
export function acquireHeavy(owner: string): (() => void) | null {
  const mine = slot.byOwner.get(owner) ?? 0;
  if (mine >= HEAVY_PER_PERSON || slot.total >= HEAVY_AT_ONCE) return null;
  slot.byOwner.set(owner, mine + 1);
  slot.total += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const left = (slot.byOwner.get(owner) ?? 1) - 1;
    if (left <= 0) slot.byOwner.delete(owner);
    else slot.byOwner.set(owner, left);
    slot.total -= 1;
  };
}

export function resetHeavy() {
  slot.total = 0;
  slot.byOwner.clear();
}
