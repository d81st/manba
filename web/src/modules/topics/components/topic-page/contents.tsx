import { getMessages } from "@/shared/i18n";
import type { PublicTopic } from "../../topic.types";

const t = getMessages().topics;
const videosTitle = getMessages().videos.title;

// The sections of a topic, so a long page of positions can be opened by side
// instead of scrolled through. On a wide screen it stays in view.
export function TopicContents({ topic, hasVideos }: { topic: PublicTopic; hasVideos: boolean }) {
  const items: { href: string; label: string }[] = [];
  if (topic.main.length > 0 || topic.mainHadiths.length > 0) items.push({ href: "#texts", label: t.texts });
  if (topic.circumstances || topic.circumstancesRefs.length > 0 || topic.circumstancesHadiths.length > 0 || topic.circumstancesNote) {
    items.push({ href: "#circumstances", label: t.circumstances });
  }
  if (topic.sides.length === 0) items.push({ href: "#positions", label: t.positions });
  topic.sides.forEach((side, i) => items.push({ href: `#side-${i}`, label: side.title }));
  if (topic.relatedRefs.length > 0 || topic.relatedHadiths.length > 0) items.push({ href: "#related", label: t.relatedRefs });
  if (hasVideos) items.push({ href: "#videos", label: videosTitle });
  if (topic.terms.length > 0 || topic.related.length > 0) items.push({ href: "#links", label: t.terms });
  if (items.length < 2) return null;

  return (
    <nav aria-label={t.contents} className="sticky top-0 z-30 -mx-1 bg-background/95 py-2 backdrop-blur lg:top-4 lg:z-auto lg:mx-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
      <p className="mb-2 hidden text-sm font-medium text-muted-foreground lg:block">{t.contents}</p>
      <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <a href={item.href} className="block rounded-md px-2 py-1 text-sm hover:bg-muted">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
