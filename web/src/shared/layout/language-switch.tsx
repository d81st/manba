import { setLocale } from "@/shared/i18n/locale.actions";
import { activeLocale } from "@/shared/i18n/active-locale";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

// The names of the languages stay in those languages, so the way back is
// readable after the switch.
export function LanguageSwitch() {
  const t = getMessages().locale;
  const current = activeLocale();
  return (
    <form action={setLocale} className="flex items-center gap-1">
      <span className="sr-only">{t.label}</span>
      {(["ru", "en"] as const).map((code) => (
        <Button
          key={code}
          type="submit"
          name="locale"
          value={code}
          variant={code === current ? "secondary" : "ghost"}
          size="sm"
          aria-current={code === current ? "true" : undefined}
        >
          {t[code]}
        </Button>
      ))}
    </form>
  );
}
