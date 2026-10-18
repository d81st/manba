import { getMessages } from "@/i18n";
import type { Collection } from "@/lib/hadith";

const t = getMessages().hadith;

// Where the text comes from, under which license, and whether it is checked.
export function HadithAttribution({ collection }: { collection: Collection }) {
  return (
    <footer className="space-y-1 border-t pt-4 text-sm text-muted-foreground">
      <p>
        {t.edition}: {collection.versionTitle}.
      </p>
      <p>
        {t.source}:{" "}
        <a href={collection.attribution.url} target="_blank" rel="noreferrer">
          {collection.attribution.title}
        </a>{" "}
        ({collection.attribution.version}). {t.license}: {collection.attribution.license}.
      </p>
      <p className="text-xs">{collection.attribution.notice}</p>
      {collection.verification !== "verified" && <p>{t.unverified}</p>}
    </footer>
  );
}
