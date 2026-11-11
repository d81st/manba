"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getMessages } from "@/shared/i18n";
import { READING_SECTIONS } from "../bookmark.place";
import { readingStore, readPlaces } from "./reading-tracker";

const t = getMessages().bookmarks.continue;

// "Continue reading" on the home page: the last place in each section of the
// library, as this browser remembers it. Nothing is shown until there is one.
export function ContinueReading() {
  const raw = useSyncExternalStore(readingStore.subscribe, readingStore.raw, () => null);
  const places = readPlaces(raw);
  const list = READING_SECTIONS.flatMap((section) => {
    const place = places[section];
    // Only a path of this site becomes a link.
    return place && typeof place.page === "string" && place.page.startsWith("/") && !place.page.startsWith("//") ? [{ section, ...place }] : [];
  }).sort((a, b) => b.at - a.at);
  if (list.length === 0) return null;
  return (
    <section className="mt-8 rounded-xl border bg-card p-4 text-card-foreground shadow-sm" aria-label={t.title}>
      <div className="flex flex-wrap items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h2 className="font-semibold">{t.title}</h2>
        <button type="button" className="ms-auto text-xs text-muted-foreground underline" onClick={() => readingStore.write(null)}>
          {t.forget}
        </button>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {list.map((place) => (
          <li key={place.section}>
            <span className="text-muted-foreground">{t.sections[place.section]}: </span>
            <Link href={place.page}>{String(place.title).slice(0, 200)}</Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t.hint}</p>
    </section>
  );
}
