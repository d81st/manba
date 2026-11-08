"use client";

import Link from "next/link";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { STORIES } from "../../quran.story-threads";
import type { MapStrings, Thread } from "./map-types";

// The lens «Нити историй»: the choice of a prophet (or Maryam), how many ayahs
// name them, and the parallels of «Истоки и связи» that touch them.
export function ThreadPanel({
  story,
  chooseStory,
  thread,
  m,
}: {
  story: string | null;
  chooseStory: (slug: string) => void;
  thread: Thread | null;
  m: MapStrings["map"];
}) {
  return (
<div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-sm">
      <Label htmlFor="map-story" className="font-normal">
        {m.story}
      </Label>
      <Select value={story ?? undefined} onValueChange={(value) => chooseStory(value)}>
        <SelectTrigger id="map-story" className="w-64">
          <SelectValue placeholder={m.storyPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {STORIES.map((s) => (
            <SelectItem key={s.slug} value={s.slug}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {thread && (
      <div className="space-y-1 text-sm text-muted-foreground">
        <p className="flex flex-wrap items-center gap-1.5">
          <span className="inline-block size-3 rounded-[3px]" style={{ background: "var(--map-match)" }} />
          {m.threadFound}: {thread.addresses.length}
        </p>
        <p className="text-xs">{m.threadNote}</p>
        {thread.parallels.length > 0 && (
          <p className="text-xs">
            {m.threadParallels}:{" "}
            {thread.parallels.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ", "}
                <Link href={`/origins/${p.slug}`}>{p.title}</Link>
              </span>
            ))}
          </p>
        )}
      </div>
    )}
  </div>
  );
}
