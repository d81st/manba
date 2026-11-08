import Link from "next/link";
import { Fragment } from "react";
import { bookPath } from "@/shared/addresses/book-query";
import { linkExternal } from "@/shared/addresses/external";
import { hadithPath } from "@/shared/addresses/hadith-query";
import { linkAddresses } from "@/shared/addresses/refs";

// Text where ayah addresses ("2:106"), hadith references ("Бухари 3951"),
// book pages ("Ибн Хишам 1:235") and verses of other religions' texts
// ("Исход 21:24", not taken for an ayah) are links into the library, and web
// addresses (a scan of an edition) open in a new tab.
export function LinkedText({ text }: { text: string }) {
  return text.split(/(https:\/\/[^\s,;«»()]+[^\s,;«»().])/).map((chunk, k) =>
    k % 2 ? (
      <a key={k} href={chunk} target="_blank" rel="noreferrer" className="break-all">
        {shortUrl(chunk)}
      </a>
    ) : (
      <Fragment key={k}>
        <LibraryLinks text={chunk} />
      </Fragment>
    ),
  );
}

// https://archive.org/details/x/page/n398/mode/2up -> archive.org/…/page/n398/mode/2up
function shortUrl(url: string) {
  const [host, ...path] = url.replace(/^https:\/\//, "").split("/");
  return path.length > 4 ? `${host}/…/${path.slice(-4).join("/")}` : [host, ...path].join("/");
}

function LibraryLinks({ text }: { text: string }) {
  return linkExternal(text).map((part, j) =>
    part.href ? (
      <Link key={j} href={part.href}>
        {part.text}
      </Link>
    ) : (
      <Fragment key={j}>
        <IslamLinks text={part.text} />
      </Fragment>
    ),
  );
}

function IslamLinks({ text }: { text: string }) {
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
      <Fragment key={i}>
        <ArabicRuns text={piece.text} />
      </Fragment>
    ),
  );
}

// Arabic letters (with vowel marks), and the spaces, digits and marks between
// Arabic words: a quote inside Russian text.
const ARABIC_RUN =
  /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]+(?:[\s\d.,:;!?()\-–—…]+[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]+)*/g;

// An Arabic quote is isolated as right-to-left text, so that the guillemets
// and marks around it keep their places in the Russian line.
function ArabicRuns({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(ARABIC_RUN)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <bdi key={m.index} dir="rtl" lang="ar" className="ar">
        {m[0]}
      </bdi>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
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
