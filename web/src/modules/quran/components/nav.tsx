import { ArrowLeft, Map, Search } from "lucide-react";
import Link from "next/link";
import { getMessages } from "@/i18n";

const t = getMessages().quran;

// Links between the Quran pages; the current page is left out.
export function QuranNav({ current }: { current: "list" | "sura" | "search" | "map" }) {
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
      {current !== "list" ? (
        <Link href="/quran" className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.allSuras}
        </Link>
      ) : (
        <span />
      )}
      <span className="flex gap-4">
        {current !== "search" && (
          <Link href="/quran/search" className="inline-flex items-center gap-1">
            <Search className="size-4" />
            {t.search.link}
          </Link>
        )}
        {current !== "map" && (
          <Link href="/quran/map" className="inline-flex items-center gap-1">
            <Map className="size-4" />
            {t.map.link}
          </Link>
        )}
      </span>
    </nav>
  );
}
