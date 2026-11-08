"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { MapSura } from "../../quran.types";
import type { Card, MapStrings } from "./map-types";

// The card of an ayah: on hover it follows the pointer; pinned by a tap or
// Enter, it stays at the bottom with a link to the ayah.
export function AyahCard({
  card,
  cardSura,
  cardText,
  t,
}: {
  card: Card;
  cardSura: MapSura;
  cardText: string | undefined;
  t: MapStrings;
}) {
  const m = t.map;
  return (
<div
    className={
      card.pinned
        ? "fixed inset-x-4 bottom-4 z-20 mx-auto max-w-xl rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"
        : "pointer-events-none absolute z-20 w-[min(320px,calc(100%-16px))] rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"
    }
    style={card.pinned ? undefined : { left: card.left, top: card.top }}
    role="status"
  >
    <p className="text-sm">
      <strong>
        {card.sura}:{card.ayah}
      </strong>{" "}
      · {cardSura.name}
    </p>
    <p className="quran my-1 line-clamp-3 text-[1.35rem] leading-loose" lang="ar" dir="rtl">
      {cardText ?? m.card.loading}
    </p>
    <p className="mb-1 text-xs text-muted-foreground">
      {cardSura.place && `${t.revelationPlace[cardSura.place as "meccan" | "medinan"]} (${t.byTradition}) · `}
      {m.card.juz} {cardSura.juz[card.ayah - 1]} · {cardSura.words[card.ayah - 1]} {m.card.words}
    </p>
    {card.pinned && (
      <Button asChild size="sm" variant="outline">
        <Link href={`/quran/${card.sura}#${card.sura}-${card.ayah}`} className="no-underline">
          <ExternalLink />
          {m.card.open}
        </Link>
      </Button>
    )}
  </div>
  );
}
