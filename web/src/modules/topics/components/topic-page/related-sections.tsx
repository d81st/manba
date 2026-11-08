import { HadithRefList } from "@/components/hadith-ref-list";
import { getMessages } from "@/i18n";
import type { PublicTopic } from "../../topic.types";
import { Chips } from "./chips";
import { SectionHeading } from "./section-heading";
import { AyahList } from "@/modules/quran";

const t = getMessages().topics;

// Related places in the library.
export function RelatedRefsSection({ topic }: { topic: PublicTopic }) {
  if (topic.relatedRefs.length === 0 && topic.relatedHadiths.length === 0) return null;
  return (
    <section>
      <SectionHeading>{t.relatedRefs}</SectionHeading>
      {topic.relatedRefs.length > 0 && <AyahList ayahs={topic.relatedRefs} compact />}
      {topic.relatedHadiths.length > 0 && <HadithRefList hadiths={topic.relatedHadiths} className="mt-3" />}
    </section>
  );
}

// Glossary terms and related topics.
export function LinksSection({ topic }: { topic: PublicTopic }) {
  if (topic.terms.length === 0 && topic.related.length === 0) return null;
  return (
    <section className="grid gap-6 sm:grid-cols-2">
      {topic.terms.length > 0 && (
        <div>
          <SectionHeading>{t.terms}</SectionHeading>
          <Chips items={topic.terms.map((term) => ({ href: `/glossary/${term.slug}`, label: term.translation }))} />
        </div>
      )}
      {topic.related.length > 0 && (
        <div>
          <SectionHeading>{t.related}</SectionHeading>
          <Chips items={topic.related.map((related) => ({ href: `/topics/${related.slug}`, label: related.title }))} />
        </div>
      )}
    </section>
  );
}
