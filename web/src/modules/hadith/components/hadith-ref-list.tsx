import Link from "next/link";
import { getMessages } from "@/shared/i18n";
import type { HadithRef } from "../hadith.types";
import { cn } from "@/shared/ui/utils";
import { VerseLine } from "@/shared/content/verse-line";

const t = getMessages().hadith;

// Hadiths referred to from a topic or a term, each in full, with a link to
// its place in the collection. A number with several narrations shows them
// one under another. A long text (a page of a book) opens on request, its
// beginning in view.
const LONG = 900;
const PREVIEW = 260;

function Paragraphs({ text }: { text: string }) {
  return (
    <div lang="ar" dir="rtl">
      {text.split(/\n\s*\n/).map((paragraph, j) => (
        <p key={j} className="ar text-lg leading-[2.1]">
          <VerseLine text={paragraph} />
        </p>
      ))}
    </div>
  );
}

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
                {item.text.length > LONG ? (
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <span className="ar block text-lg leading-[2.1] group-open:hidden" lang="ar" dir="rtl">
                        {item.text.slice(0, PREVIEW).replace(/\s+\S*$/, "")} …
                      </span>
                      <span className="text-sm text-primary group-open:hidden">{t.showWhole}</span>
                      <span className="hidden text-sm text-primary group-open:inline">{t.hideWhole}</span>
                    </summary>
                    <Paragraphs text={item.text} />
                  </details>
                ) : (
                  <Paragraphs text={item.text} />
                )}
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
