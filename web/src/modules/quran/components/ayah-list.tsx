import Link from "next/link";
import { cn } from "@/lib/utils";

export type ListedAyah = { address: string; sura: number; ayah: number; suraName: string; text: string };

// Ayahs with their addresses; each address opens the ayah in the library.
export function AyahList({
  ayahs,
  compact,
  muted,
  className,
}: {
  ayahs: ListedAyah[];
  compact?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("border-t", className)}>
      {ayahs.map((ref) => (
        <li key={ref.address} className="flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-baseline sm:gap-4">
          <Link
            href={`/quran/${ref.sura}#${ref.sura}-${ref.ayah}`}
            className="min-w-24 shrink-0 text-xs tabular-nums text-muted-foreground no-underline"
          >
            {ref.sura}:{ref.ayah}
            <span className="block">{ref.suraName}</span>
          </Link>
          <p
            className={cn(
              "quran flex-1 leading-[2.2]",
              compact ? "text-xl" : "text-2xl",
              muted && "text-muted-foreground",
            )}
            lang="ar"
            dir="rtl"
          >
            {ref.text}
          </p>
        </li>
      ))}
    </ol>
  );
}
