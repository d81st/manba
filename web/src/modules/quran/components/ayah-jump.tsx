"use client";

import { useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ayahInSura } from "../quran.ayah-jump";

const t = getMessages().quran;

// Opens one ayah of the sura already on the page. The bar stays at the top
// while the reader scrolls a long sura.
export function AyahJump({ sura, ayahs }: { sura: number; ayahs: number }) {
  const [value, setValue] = useState("");
  const [missing, setMissing] = useState(false);

  return (
    <form
      className="sticky top-0 z-20 mt-4 flex flex-wrap items-center gap-2 border-b bg-background py-2 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const n = ayahInSura(value, ayahs);
        // A previous sura can stay mounted, so the same id may exist twice.
        // Scroll the one that is on screen.
        const row =
          n === null
            ? null
            : [...document.querySelectorAll<HTMLElement>(`[id="${sura}-${n}"]`)].find(
                (node) => node.getClientRects().length > 0,
              );
        if (!row) {
          setMissing(true);
          return;
        }
        setMissing(false);
        const hash = `#${sura}-${n}`;
        if (window.location.hash !== hash) history.pushState(null, "", hash);
        row.scrollIntoView({ block: "start" });
      }}
    >
      <Label htmlFor="ayah-jump">{t.jump.label}</Label>
      <Input
        id="ayah-jump"
        inputMode="numeric"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setMissing(false);
        }}
        className="w-24"
        aria-describedby={missing ? "ayah-jump-missing" : undefined}
      />
      <Button type="submit" variant="outline" size="sm">
        {t.jump.submit}
      </Button>
      {missing && (
        <p id="ayah-jump-missing" className="text-sm text-destructive">
          {t.jump.missing}
        </p>
      )}
    </form>
  );
}
