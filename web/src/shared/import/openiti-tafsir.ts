// Parses a Quran commentary in the annotated OpenITI layout of the Tafsir of
// Ibn Kathir: "### | تفسير سورة …" opens a surah, "### || {… (63) … (64) }"
// quotes the ayahs commented on next, with their numbers. A comment is
// addressed by its surah and first ayah and covers the ayahs it quotes
// (docs/ADDRESSES.md). The author's introduction before the first surah is
// kept in numbered parts. Nothing is guessed: ayahs no heading quotes are
// reported, and stay without a comment.
import { cleanLine } from "./openiti-hadith.ts";

export type TafsirIntro = { index: number; title: string; paragraphs: string[] };
export type TafsirComment = {
  sura: number;
  from: number; // 0: what the commentator says of the surah before its first ayah
  to: number;
  ayahs: number[]; // the ayahs its heading quotes (two quoted passages may leave a gap)
  heading: string; // the quoted ayahs, as printed
  paragraphs: string[];
};
export type TafsirReport = {
  surahs: number;
  comments: number;
  uncovered: { sura: number; ayahs: number[] }[]; // ayahs no heading quotes
  repeated: { sura: number; ayahs: number[] }[]; // ayahs quoted by more than one heading
  unheaded: number[]; // surahs that start without their own section heading
  joined: number; // quotes printed right before the next heading, joined to it
};
export type TafsirBook = {
  intro: TafsirIntro[];
  surahs: { sura: number; title: string }[]; // the edition's heading of each surah ("" where it is lost)
  comments: TafsirComment[];
  report: TafsirReport;
};

// The ayah numbers of a quoted passage: "(63)" after each ayah, or a bare
// number before the closing brace ("{… الم 1}"). A heading may quote two
// passages ("{… (60) } {… (66) … (73) }"): their runs are put together.
function ayahNumbers(quote: string): number[] {
  const numbers: number[] = [];
  for (const part of quote.split(/\}\s*\{/)) {
    const run = numberRun(part);
    if (run.length && (numbers.length === 0 || run[0] > numbers[numbers.length - 1])) numbers.push(...run);
  }
  return numbers;
}

function numberRun(quote: string): number[] {
  const numbers = [...quote.matchAll(/\((\d{1,3})\)|(\d{1,3})\s*$/g)].map((m) => Number(m[1] ?? m[2]));
  // Footnote marks also come in brackets: keep the run of consecutive numbers.
  const run: number[] = [];
  for (const n of numbers) {
    if (run.length === 0 || n === run[run.length - 1] + 1) run.push(n);
    else if (n > run[run.length - 1] + 1) break;
  }
  return run;
}

// "{… (63) … (64) } ." -> the quoted ayahs and their numbers, or null if the
// heading quotes none. A few headings lost their opening brace ("يس (1) …}"):
// those count only with two ayah numbers or more, since a lone "(3)" in a
// heading is a footnote mark.
function quotedAyahs(heading: string) {
  const text = heading.replace(/^[.\s]+/, "");
  const braced = text.match(/^\{([\s\S]*)\}[\s.]*$/);
  const quote = braced ? braced[1] : text.replace(/\}[\s.]*$/, "");
  const numbers = ayahNumbers(quote);
  if (numbers.length === 0 || (!braced && numbers.length < 2)) return null;
  return { quote: cleanLine(quote.replace(/[{}]/g, " ")), numbers };
}

export function parseOpenitiTafsir(source: string, ayahCounts: number[]): TafsirBook {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");

  const intro: TafsirIntro[] = [];
  const surahs: { sura: number; title: string }[] = [];
  const comments: TafsirComment[] = [];
  const report: TafsirReport = { surahs: 0, comments: 0, uncovered: [], repeated: [], unheaded: [], joined: 0 };
  let sura = 0;
  let target: string[] | null = null; // paragraphs being filled
  let paragraph: string[] | null = null;
  const covered = new Map<number, number[]>(); // sura -> ayahs quoted, in order

  const closeParagraph = () => {
    const text = paragraph ? cleanLine(paragraph.join(" ")) : "";
    paragraph = null;
    if (!text) return;
    // A paragraph that is only a quote of the next ayahs, with their numbers,
    // is a heading the export printed as text.
    const seen = sura > 0 ? covered.get(sura)! : null;
    const quote = seen && /^\{[\s\S]*\}[\s.]*$/.test(text) ? quotedAyahs(text) : null;
    if (quote && seen && quote.numbers[0] === (seen[seen.length - 1] ?? 0) + 1) {
      openComment(quote);
      return;
    }
    if (!target) {
      // Text right after a surah heading, before its first ayah: the surah's opening.
      if (sura === 0) {
        intro.push({ index: intro.length + 1, title: "", paragraphs: [] });
        target = intro[intro.length - 1].paragraphs;
      } else {
        comments.push({ sura, from: 0, to: 0, ayahs: [], heading: "", paragraphs: [] });
        target = comments[comments.length - 1].paragraphs;
      }
    }
    target.push(text);
  };
  const openComment = (quote: { quote: string; numbers: number[] }) => {
    const from = quote.numbers[0];
    const to = quote.numbers[quote.numbers.length - 1];
    if (to > ayahCounts[sura]) {
      throw new Error(`OpenITI: surah ${sura} has ${ayahCounts[sura]} ayahs, a heading quotes ${from}-${to}`);
    }
    covered.get(sura)!.push(...quote.numbers);
    comments.push({ sura, from, to, ayahs: quote.numbers, heading: quote.quote, paragraphs: [] });
    target = comments[comments.length - 1].paragraphs;
  };
  const startSurah = (title = "") => {
    sura += 1;
    surahs.push({ sura, title });
    if (sura > ayahCounts.length - 1) throw new Error(`OpenITI: more than ${ayahCounts.length - 1} surahs`);
    covered.set(sura, []);
    target = null;
  };

  // A heading goes on over "~~" lines, like a paragraph.
  const blocks: string[] = [];
  // A line with no mark at all goes on the line before it too.
  for (const raw of lines.slice(end + 1)) {
    const last = blocks.length - 1;
    if (raw.startsWith("~~") && last >= 0 && blocks[last].startsWith("### ")) blocks[last] += ` ${raw.slice(2)}`;
    else if (raw.trim() && !/^(#|~~)/.test(raw) && last >= 0) blocks[last] += ` ${raw.trim()}`;
    else blocks.push(raw);
  }

  for (const raw of blocks) {
    const heading = raw.match(/^### (\|+) ?([\s\S]*)$/);
    if (heading) {
      closeParagraph();
      const level = heading[1].length;
      const title = cleanLine(heading[2]);
      const quote = level === 2 && sura > 0 ? quotedAyahs(title) : null;
      if (level === 1 && /سورة|سورتي|فاتحة الكتاب/.test(title)) {
        startSurah(title);
      } else if (level <= 2 && sura === 0) {
        intro.push({ index: intro.length + 1, title, paragraphs: [] });
        target = intro[intro.length - 1].paragraphs;
      } else if (quote) {
        const seen = covered.get(sura)!;
        // A surah whose section heading the export lost: its first ayah comes
        // after the previous surah's last one.
        if (quote.numbers[0] === 1 && seen.length > 0 && seen[seen.length - 1] === ayahCounts[sura]) {
          report.unheaded.push(sura + 1);
          startSurah();
        }
        openComment(quote);
      } else {
        // A sub-heading inside a comment ("فصل"): kept as a line of its text.
        paragraph = [title];
        closeParagraph();
      }
    } else if (raw.startsWith("# ")) {
      closeParagraph();
      paragraph = [raw.slice(2)];
    } else if (raw.startsWith("~~")) {
      (paragraph ??= []).push(raw.slice(2));
    }
  }
  closeParagraph();

  // A quote with no text of its own, right before a heading (the edition
  // prints them as one block): it joins the comment that follows.
  for (let i = comments.length - 2; i >= 0; i--) {
    const [quote, next] = [comments[i], comments[i + 1]];
    if (quote.paragraphs.length === 0 && quote.from > 0 && next.sura === quote.sura && next.from === quote.to + 1) {
      next.from = quote.from;
      next.ayahs = [...quote.ayahs, ...next.ayahs];
      next.heading = `${quote.heading} ${next.heading}`;
      comments.splice(i, 1);
      report.joined += 1;
    }
  }
  if (comments.some((c) => c.paragraphs.length === 0)) {
    const empty = comments.find((c) => c.paragraphs.length === 0)!;
    throw new Error(`OpenITI: comment ${empty.sura}:${empty.from} has no text`);
  }

  report.surahs = sura;
  if (sura !== ayahCounts.length - 1) throw new Error(`OpenITI: ${sura} surahs found`);
  for (let s = 1; s <= sura; s++) {
    const seen = covered.get(s)!;
    const counts = new Map<number, number>();
    for (const a of seen) counts.set(a, (counts.get(a) ?? 0) + 1);
    const missing = Array.from({ length: ayahCounts[s] }, (_, i) => i + 1).filter((a) => !counts.has(a));
    const twice = [...counts].filter(([, n]) => n > 1).map(([a]) => a);
    if (missing.length) report.uncovered.push({ sura: s, ayahs: missing });
    if (twice.length) report.repeated.push({ sura: s, ayahs: twice });
  }
  report.comments = comments.length;
  return { intro, surahs, comments, report };
}
