// Which ayah number of this sura a reader asked to open. No page access here,
// so it is unit-tested. Arabic-Indic digits count as the same numbers.

export function ayahInSura(raw: string, count: number): number | null {
  const digits = raw.trim().replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
  if (!/^\d{1,3}$/.test(digits)) return null;
  const n = Number(digits);
  if (!Number.isInteger(count) || count < 1 || n < 1 || n > count) return null;
  return n;
}
