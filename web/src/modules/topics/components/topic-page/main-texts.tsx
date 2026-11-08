import { HadithRefList } from "@/components/hadith-ref-list";
import { getMessages } from "@/i18n";
import type { MainPassage, PublicTopic } from "../../topic.types";
import { SectionHeading } from "./section-heading";
import { AyahList } from "@/modules/quran";

const t = getMessages().topics;

// The texts of the topic in full: each passage with the ayahs around it, then hadiths.
export function MainTexts({ topic }: { topic: PublicTopic }) {
  if (topic.main.length === 0 && topic.mainHadiths.length === 0) return null;
  return (
    <section>
      <SectionHeading>{t.texts}</SectionHeading>
      <div className="space-y-6">
        {topic.main.map((passage) => (
          <Passage key={`${passage.sura}-${passage.from}`} passage={passage} />
        ))}
        {topic.mainHadiths.length > 0 && (
          <div className="rounded-xl border bg-card px-4 shadow-sm">
            <HadithRefList hadiths={topic.mainHadiths} className="border-t-0" />
          </div>
        )}
      </div>
    </section>
  );
}

// A main passage in full; the ayahs around it open on request.
function Passage({ passage }: { passage: MainPassage }) {
  return (
    <div className="rounded-xl border bg-card px-4 shadow-sm">
      {passage.before.length > 0 && (
        <details>
          <summary className="cursor-pointer py-2 text-sm text-muted-foreground">{t.contextBefore}</summary>
          <AyahList ayahs={passage.before} compact muted />
        </details>
      )}
      <AyahList ayahs={passage.ayahs} className={passage.before.length > 0 ? undefined : "border-t-0"} />
      {passage.after.length > 0 && (
        <details>
          <summary className="cursor-pointer py-2 text-sm text-muted-foreground">{t.contextAfter}</summary>
          <AyahList ayahs={passage.after} compact muted />
        </details>
      )}
    </div>
  );
}
