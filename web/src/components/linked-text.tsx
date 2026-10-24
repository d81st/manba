import Link from "next/link";
import { Fragment } from "react";
import { bookPath } from "@/lib/book-query";
import { linkAddresses } from "@/lib/glossary-input";
import { hadithPath } from "@/lib/hadith-query";

// Text where ayah addresses ("2:106"), hadith references ("Бухари 3951") and
// book pages ("Ибн Хишам 1:235") are links into the library.
export function LinkedText({ text }: { text: string }) {
  return linkAddresses(text).map((piece, i) =>
    "sura" in piece ? (
      <Link key={i} href={`/quran/${piece.sura}#${piece.sura}-${piece.from}`}>
        {piece.text}
      </Link>
    ) : "book" in piece ? (
      <Link key={i} href={bookPath(piece.book, piece.path)}>
        {piece.text}
      </Link>
    ) : "work" in piece ? (
      <Link key={i} href={hadithPath(piece.work, piece.path)}>
        {piece.text}
      </Link>
    ) : (
      <Fragment key={i}>{piece.text}</Fragment>
    ),
  );
}

// Paragraphs separated by blank lines, with ayah addresses as links.
export function LinkedParagraphs({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed">
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          <LinkedText text={paragraph} />
        </p>
      ))}
    </div>
  );
}
