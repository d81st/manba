import { getMessages, plural } from "@/i18n";
import type { SuraSummary } from "@/lib/quran";

const t = getMessages().quran;

// "286 аятов · мединская (по традиции)"; the list states the basis once instead.
export function SuraMeta({ sura, showBasis = true }: { sura: SuraSummary; showBasis?: boolean }) {
  const place = sura.revelationPlace as keyof typeof t.revelationPlace | null;
  return (
    <span className="muted">
      {plural(sura.ayahs, t.ayahs)}
      {place && t.revelationPlace[place] && (
        <>
          {" · "}
          {t.revelationPlace[place]}
          {showBasis && ` (${t.byTradition})`}
        </>
      )}
    </span>
  );
}
