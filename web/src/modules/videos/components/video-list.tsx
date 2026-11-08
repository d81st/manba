import { ExternalLink, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import type { PublicVideo } from "../video.types";
import { cn } from "@/lib/utils";

const t = getMessages().videos;

// Videos next to a fragment or a topic: links out, never embedded (the
// platform would learn who reads what), marked as additional material.
export function VideoList({ videos, compact = false, className }: { videos: PublicVideo[]; compact?: boolean; className?: string }) {
  if (videos.length === 0) return null;
  const items = (
    <ul className="space-y-2">
      {videos.map((video) => (
        <li key={video.url} className="text-sm">
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-1 font-medium">
            <span dir="auto">{video.title}</span>
            <ExternalLink className="size-3 shrink-0 self-center" />
          </a>
          <span className="ms-2 text-muted-foreground">
            {[t.platforms[video.platform], video.channel, video.language].filter(Boolean).join(" · ")}
          </span>
          {video.linkState === "unavailable" && (
            <Badge variant="destructive" className="ms-2 text-[0.7rem]">
              {t.unavailable}
            </Badge>
          )}
          {video.note && (
            <p className="mt-0.5 text-muted-foreground" dir="auto">
              {video.note}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
  if (compact) {
    return (
      <details className={cn("text-sm", className)}>
        <summary className="cursor-pointer text-muted-foreground">
          {t.summary.replace("{count}", String(videos.length))}
        </summary>
        <p className="mt-1 mb-2 text-xs text-muted-foreground">{t.hint}</p>
        {items}
      </details>
    );
  }
  return (
    <section className={cn("rounded-xl border border-dashed p-4", className)}>
      <h2 className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        <Video className="size-4" />
        {t.title}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">{t.hint}</p>
      {items}
    </section>
  );
}
