import Link from "next/link";
import { getMessages } from "@/i18n";
import { bookPath, formatBookRef } from "@/lib/book-query";
import type { SiraDate } from "@/lib/sira-events";

const t = getMessages().sira;

// The four books of the dates, each with its own color slot (globals.css).
export const SOURCE_WORKS = ["ibn_hisham", "maghazi_waqidi", "tarikh_khalifa", "tarikh_tabari"] as const;
export const SOURCE_COLORS: Record<string, { fill: string; stroke: string; bg: string }> = {
  ibn_hisham: { fill: "fill-sira-ibn-hisham", stroke: "stroke-sira-ibn-hisham", bg: "bg-sira-ibn-hisham" },
  maghazi_waqidi: { fill: "fill-sira-waqidi", stroke: "stroke-sira-waqidi", bg: "bg-sira-waqidi" },
  tarikh_khalifa: { fill: "fill-sira-khalifa", stroke: "stroke-sira-khalifa", bg: "bg-sira-khalifa" },
  tarikh_tabari: { fill: "fill-sira-tabari", stroke: "stroke-sira-tabari", bg: "bg-sira-tabari" },
};
const OTHER = { fill: "fill-muted-foreground", stroke: "stroke-muted-foreground", bg: "bg-muted-foreground" };

export function workOf(address: string) {
  return address.split(".")[0];
}

export function sourceColor(address: string) {
  return SOURCE_COLORS[workOf(address)] ?? OTHER;
}

export function sourceLabel(address: string) {
  const work = workOf(address);
  return t.sourceLabels[work as keyof typeof t.sourceLabels] ?? work;
}

// The page of a quoted passage, "Вакиди 1:2".
export function pageOf(address: string) {
  const [work, volume, page] = address.split(".");
  return { href: bookPath(work, [Number(volume), Number(page)]), label: formatBookRef(`${work}.${volume}.${page}`) };
}

export function SourceLink({ address }: { address: string }) {
  const { href, label } = pageOf(address);
  return (
    <Link href={href} className="tabular-nums">
      {label}
    </Link>
  );
}

export function isPreview(params: Record<string, string | string[] | undefined>) {
  return params.drafts === "1";
}

// Back to the section and the switch between published and the preview with drafts.
export function SiraNav({ path, preview }: { path: string; preview: boolean }) {
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
      <Link href={preview ? "/sira?drafts=1" : "/sira"}>← {t.back}</Link>
      <Link href={preview ? path : `${path}?drafts=1`} className="text-muted-foreground">
        {preview ? t.publishedLink : t.previewLink}
      </Link>
    </nav>
  );
}

export function PreviewNote({ preview }: { preview: boolean }) {
  if (!preview) return null;
  return <p className="mt-3 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">{t.preview}</p>;
}

export function SourceDot({ address, className = "" }: { address: string; className?: string }) {
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ${sourceColor(address).bg} ${className}`} />;
}

export function sortDates(dates: SiraDate[]) {
  const order = (d: SiraDate) => {
    const i = SOURCE_WORKS.indexOf(workOf(d.address) as (typeof SOURCE_WORKS)[number]);
    return i < 0 ? SOURCE_WORKS.length : i;
  };
  return [...dates].sort((a, b) => order(a) - order(b));
}
