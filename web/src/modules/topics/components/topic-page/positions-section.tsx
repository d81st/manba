import { HadithRefList } from "@/components/hadith-ref-list";
import { LinkedParagraphs, LinkedText } from "@/components/linked-text";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import type { PublicPosition, PublicTopic } from "../../topic.types";
import { SectionHeading } from "./section-heading";
import { AyahList } from "@/modules/quran";

const messages = getMessages();
const t = messages.topics;
const recognitions = messages.admin.recognitions;

// Positions of all sides, grouped by side, each with its degree of recognition.
export function PositionsSection({ sides }: { sides: PublicTopic["sides"] }) {
  return (
    <section>
      <SectionHeading>{t.positions}</SectionHeading>
      {sides.length === 0 ? (
        <p className="text-muted-foreground">{t.noPositions}</p>
      ) : (
        <div className="space-y-6">
          {sides.map((side) => (
            <div key={side.title}>
              <h3 className="mb-2 font-semibold">{side.title}</h3>
              <ul className="space-y-4">
                {side.positions.map((position, i) => (
                  <PositionCard key={i} position={position} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PositionCard({ position }: { position: PublicPosition }) {
  return (
    <li className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{position.holder}</span>
        <Badge variant={position.recognition === "minority" ? "outline" : "secondary"}>
          {recognitions[position.recognition as keyof typeof recognitions]}
        </Badge>
      </div>
      <div className="mt-2">
        <LinkedParagraphs text={position.text} />
      </div>
      {position.refs.length > 0 && <AyahList ayahs={position.refs} compact className="mt-3" />}
      {position.hadiths.length > 0 && <HadithRefList hadiths={position.hadiths} className="mt-3" />}
      {position.sourceNote && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t.sourceNote}: <LinkedText text={position.sourceNote} />
        </p>
      )}
    </li>
  );
}
