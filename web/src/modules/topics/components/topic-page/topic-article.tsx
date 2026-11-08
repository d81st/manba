import type { GraphData } from "@/shared/graph/graph.types";
import type { PublicTopic, TopicPlace } from "../../topic.types";
import { TopicBadge } from "../topic-badges";
import { CircumstancesSection } from "./circumstances-section";
import { MainTexts } from "./main-texts";
import { PlaceSection } from "./place-section";
import { PositionsSection } from "./positions-section";
import { LinksSection, RelatedRefsSection } from "./related-sections";
import { TopicSchema } from "./topic-schema";
import { type PublicVideo, VideoList } from "@/modules/videos";

// A published topic: the texts in full, their circumstances, the positions of
// all sides, related places, videos and links. Data comes from the page.
export function TopicArticle({
  topic,
  place,
  videos,
  schema,
  notice,
}: {
  topic: PublicTopic;
  place: TopicPlace | null;
  videos: PublicVideo[];
  schema?: GraphData;
  notice?: React.ReactNode;
}) {
  return (
    <article id="top" className="mt-3 scroll-mt-4 space-y-8">
      {notice}
      <header className="space-y-2 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{topic.title}</h1>
          <TopicBadge category={topic.category} linked />
        </div>
        <p className="text-lg text-muted-foreground">{topic.question}</p>
      </header>
      {schema && <TopicSchema data={schema} />}
      {place && <PlaceSection place={place} />}
      <MainTexts topic={topic} />
      <CircumstancesSection topic={topic} />
      <PositionsSection sides={topic.sides} />
      <RelatedRefsSection topic={topic} />
      <VideoList videos={videos} />
      <LinksSection topic={topic} />
    </article>
  );
}
