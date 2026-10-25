import Link from "next/link";
import { getMessages } from "@/i18n";
import type { HadithRef } from "@/lib/hadith";
import { cn } from "@/lib/utils";
import { VerseLine } from "@/components/verse-line";

const t = getMessages().hadith;

// Hadiths referred to from a topic or a term, each in full, with a link to
// its place in the collection. A number with several narrations shows them
// one under another.
export function HadithRefList({ hadiths, className }: { hadiths: HadithRef[]; className?: string }) {
  return (
    <ol className={cn("border-t", className)}>
      {hadiths.map((ref) => (
        <li key={ref.address} className="flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-baseline sm:gap-4">
          <Link href={ref.href} className="min-w-24 shrink-0 text-xs tabular-nums text-muted-foreground no-underline">
            {ref.title}
          </Link>
          <div className="flex-1 space-y-3">
            {ref.items.map((item, i) => (
              <div key={i}>
                {item.label && <p className="text-xs tabular-nums text-muted-foreground">{item.label}</p>}
                <div lang="ar" dir="rtl">
                  {item.text.split(/\n\s*\n/).map((paragraph, j) => (
                    <p key={j} className="ar text-lg leading-[2.1]">
                      <VerseLine text={paragraph} />
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {ref.more > 0 && (
              <Link href={ref.href} className="text-sm">
                {t.moreTexts.replace("{count}", String(ref.more))}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
