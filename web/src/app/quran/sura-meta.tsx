import { getMessages, plural } from "@/i18n";
import type { SuraSummary } from "@/lib/quran";
import { cn } from "@/lib/utils";

const t = getMessages().quran;

// "286 аятов · мединская (по традиции)"; the list states the basis once instead.
export function SuraMeta({
  sura,
  showBasis = true,
  className,
}: {
  sura: SuraSummary;
  showBasis?: boolean;
  className?: string;
}) {
  const place = sura.revelationPlace as keyof typeof t.revelationPlace | null;
  return (
    <span className={cn("text-muted-foreground", className)}>
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
