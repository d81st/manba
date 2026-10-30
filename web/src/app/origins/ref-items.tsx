import Link from "next/link";
import { HadithRefList } from "@/components/hadith-ref-list";
import { getMessages } from "@/i18n";
import type { RefItem } from "@/lib/parallels";
import { cn } from "@/lib/utils";

const t = getMessages().external;

// Passages of a link, each in full: ayahs, hadiths and pages of books, and
// verses of another religion's text with the translation beside the original.
export function RefItems({ items, className }: { items: RefItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ol className={cn("border-t", className)}>
      {items.map((item, i) => {
        if (item.kind === "hadith") {
          return (
            <li key={i}>
              <HadithRefList hadiths={[item.ref]} className="border-t-0" />
            </li>
          );
        }
        if (item.kind === "ayah") {
          return (
            <li key={i} className="flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <Link href={item.href} className="min-w-24 shrink-0 text-xs tabular-nums text-muted-foreground no-underline">
                {item.label}
              </Link>
              <p className="quran flex-1 text-2xl leading-[2.2]" lang="ar" dir="rtl">
                {item.text}
              </p>
            </li>
          );
        }
        return (
          <li key={i} className="border-b py-3">
            <Link href={item.href} className="text-xs tabular-nums text-muted-foreground no-underline">
              {item.label}
            </Link>
            <div className="mt-1 space-y-3">
              {item.verses.map((v) => (
                <div key={v.address} className="grid gap-2 md:grid-cols-2 md:gap-6">
                  <p lang={item.language} dir={item.dir} className={cn("leading-relaxed", item.dir === "rtl" ? "text-xl" : "text-lg")}>
                    <span className="me-1 align-super text-xs text-muted-foreground tabular-nums">{v.n}</span>
                    {v.original}
                  </p>
                  <p className="leading-relaxed text-muted-foreground">{v.translation || <span className="text-xs">{t.noTranslation}</span>}</p>
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
