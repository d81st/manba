import { LinkedParagraphs, LinkedText } from "@/components/linked-text";
import { getMessages } from "@/i18n";
import type { PublicTopic } from "../../topic.types";
import { SectionHeading } from "./section-heading";
import { AyahList } from "@/modules/quran";
import { HadithRefList } from "@/modules/hadith";

const t = getMessages().topics;

// Circumstances of the texts with their references and the source note.
export function CircumstancesSection({ topic }: { topic: PublicTopic }) {
  const { circumstances, circumstancesRefs, circumstancesHadiths, circumstancesNote } = topic;
  if (!circumstances && circumstancesRefs.length === 0 && circumstancesHadiths.length === 0 && !circumstancesNote) {
    return null;
  }
  return (
    <section>
      <SectionHeading>{t.circumstances}</SectionHeading>
      {circumstances && <LinkedParagraphs text={circumstances} />}
      {circumstancesRefs.length > 0 && <AyahList ayahs={circumstancesRefs} compact className="mt-3" />}
      {circumstancesHadiths.length > 0 && <HadithRefList hadiths={circumstancesHadiths} className="mt-3" />}
      {circumstancesNote && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t.sourceNote}: <LinkedText text={circumstancesNote} />
        </p>
      )}
    </section>
  );
}
