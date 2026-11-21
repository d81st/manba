import { getMessages } from "@/shared/i18n";
import { parseTranslation } from "../quran.translation-markup";
import { TranslatorNote } from "./translator-note";

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
          <TranslatorNote key={i} text={piece.text} />
        ) : (
          <span key={i}>{piece.text}</span>
        ),
      )}
    </>
  );
}
