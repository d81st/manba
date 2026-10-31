import { getMessages } from "@/i18n";
import { parseTranslation } from "@/lib/translation-markup";

const t = getMessages().quran.translation;

// A translation's text: added words in italics and muted, notes in small type.
export function TranslationText({ content }: { content: string }) {
  return (
    <>
      {parseTranslation(content).map((piece, i) =>
        piece.kind === "added" ? (
          <em key={i} className="text-muted-foreground" title={t.addedHint}>
            {piece.text}
          </em>
        ) : piece.kind === "note" ? (
          <span key={i} className="text-xs text-muted-foreground">
            {" "}
            [{t.note}: {piece.text}]
          </span>
        ) : (
          <span key={i}>{piece.text}</span>
        ),
      )}
    </>
  );
}
