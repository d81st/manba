import { getMessages, plural } from "@/shared/i18n";
import { Reveal } from "@/shared/ui/reveal";
import type { GraphData } from "@/shared/graph/graph.types";
import type { PublicTopic, TopicPlace } from "../../topic.types";
import { TopicBadge } from "../topic-badges";
import { CircumstancesSection } from "./circumstances-section";
import { TopicContents } from "./contents";
import { MainTexts } from "./main-texts";
import { PlaceSection } from "./place-section";
import { PositionsSection } from "./positions-section";
import { LinksSection, RelatedRefsSection } from "./related-sections";
import { TopicSchema } from "./topic-schema";
import { VersionsSection } from "./versions-section";
import { MapSection } from "./map-section";
import { type PublicVideo, VideoList } from "@/modules/videos";
import { TopicTimeline } from "@/modules/sira";

const t = getMessages().topics;
const videosTitle = getMessages().videos.title;

// A published topic: the texts in full, their circumstances, the positions of
// all sides, related places, videos and links. Data comes from the page.
export function TopicArticle({
  topic,
  place,
  videos,
  schema,
  notice,
  preview = false,
}: {
  preview?: boolean;
  topic: PublicTopic;
  place: TopicPlace | null;
  videos: PublicVideo[];
  schema?: GraphData;
  notice?: React.ReactNode;
}) {
  return (
    // The page's own contents stand on the right of the text on a wide screen
    // (the left belongs to the tree of the site); on a narrow one, a strip above it.
    <div className="mt-3 xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:items-start xl:gap-8">
      <div className="xl:sticky xl:top-4 xl:order-last">
        <TopicContents topic={topic} hasVideos={videos.length > 0} />
      </div>
      <article id="top" className="min-w-0 scroll-mt-4 space-y-8">
        {notice}
        <header className="space-y-2 border-b pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{topic.title}</h1>
            <TopicBadge category={topic.category} linked />
          </div>
          <p className="text-lg text-muted-foreground">{topic.question}</p>
          <p className="text-sm text-muted-foreground">{t.reading}</p>
        </header>
        {schema && <TopicSchema data={schema} />}
        {place && <PlaceSection place={place} />}
        {topic.places.length > 0 && <MapSection places={topic.places} />}
        {topic.events.length > 0 && <TopicTimeline events={topic.events} suffix={preview ? "?drafts=1" : ""} />}
        <MainTexts topic={topic} />
        <CircumstancesSection topic={topic} />
        {topic.versions && <VersionsSection versions={topic.versions} />}
        <PositionsSection sides={topic.sides} />
        <RelatedRefsSection topic={topic} />
        {videos.length > 0 && (
          <Reveal id="videos" title={videosTitle} count={plural(videos.length, t.counts.videos)}>
            <VideoList videos={videos} bare />
          </Reveal>
        )}
        <LinksSection topic={topic} />
      </article>
    </div>
  );
}
