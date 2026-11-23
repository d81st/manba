import { LinkedParagraphs, LinkedText } from "@/shared/content/linked-text";
import { getMessages, plural } from "@/shared/i18n";
import { Reveal } from "@/shared/ui/reveal";
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
    <section id="circumstances" className="scroll-mt-4">
      <SectionHeading>{t.circumstances}</SectionHeading>
      {circumstances && <LinkedParagraphs text={circumstances} quotes={topic.circumstancesQuotes} quoteTitle={t.quoteLink} />}
      {/* The paragraph stays in view (no text without its context); the passages
          it cites, in full, open on request. */}
      {(circumstancesRefs.length > 0 || circumstancesHadiths.length > 0) && (
        <Reveal
          id="circumstances-texts"
          className="mt-3"
          title={t.circumstancesTexts}
          count={plural(circumstancesRefs.length + circumstancesHadiths.length, t.counts.refs)}
        >
          {circumstancesRefs.length > 0 && <AyahList ayahs={circumstancesRefs} compact />}
          {circumstancesHadiths.length > 0 && <HadithRefList hadiths={circumstancesHadiths} className="mt-3" />}
        </Reveal>
      )}
      {circumstancesNote && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t.sourceNote}: <LinkedText text={circumstancesNote} />
        </p>
      )}
    </section>
  );
}
