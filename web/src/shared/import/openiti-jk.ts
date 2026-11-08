// Exports of the al-Jami' al-Kabir library (JK) in OpenITI come in a rougher
// layout than the annotated texts: no heading marks, line breaks of the
// printed page kept as "|", formulas of blessing printed with a symbol font.
// These functions rewrite such an export into the annotated layout read by
// parseOpenitiRunning ("### |" a part, "### ||" a chapter, "# N - " a report)
// without touching the words: they only decode the symbols, drop the modern
// editor's footnotes and move the markers. What each symbol stands for was
// checked word by word against the Shamela copy of the same book in OpenITI
// (data/sources/openiti/README.md).

const SALLA = "صلى الله عليه وسلم";
const MILESTONE = /\s*\bms[A-Z]?\d+\b\s*/g;

function header(lines: string[]) {
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");
  return end;
}

// "# " opens a block, "~~" goes on with it.
function blocks(lines: string[]) {
  const out: string[] = [];
  for (const raw of lines) {
    if (raw.startsWith("# ")) out.push(raw.slice(2));
    else if (raw.startsWith("~~") && out.length) out[out.length - 1] += ` ${raw.slice(2)}`;
  }
  return out;
}

const squeeze = (text: string) => text.replace(/\s+/g, " ").trim();

type Out = { level: 0 | 1 | 2; text: string };

// Headings of one level in a row are one heading broken over printed lines,
// unless the next one opens a new chapter ("باب").
function render(head: string[], out: Out[]) {
  const merged: Out[] = [];
  for (const item of out) {
    const last = merged.at(-1);
    if (item.level > 0 && last && last.level === item.level && !/^باب /.test(item.text)) {
      last.text = `${last.text} ${item.text}`;
    } else merged.push({ ...item });
  }
  const body = merged.map((o) => (o.level === 0 ? `# ${o.text}` : `### ${"|".repeat(o.level)} ${o.text}`));
  return [...head, "", ...body, ""].join("\n");
}

// Kitab al-Masahif of Ibn Abi Dawud (JK009180): a report opens with "[ N ]";
// the blessing on the prophet is "[ $ ]", and where the export broke the
// line inside it, "[" ends one line and "]" opens the next ("# | ]").
// A heading is a line that opened with "|" (or ends with "$ |") and holds no
// report; "الجزء ..." starts a part of the book.
export function masahifToAnnotated(source: string) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = header(lines);
  const raw = blocks(lines.slice(end + 1));

  // Glue the blessings broken over two lines back together.
  const glued: string[] = [];
  for (const text of raw) {
    const prev = glued.at(-1);
    const rest = text.match(/^(?:\|\s*)*\$?\s*\]\s*(.*)$/);
    if (prev !== undefined && /\[\s*\$?\s*$/.test(prev) && rest) {
      glued[glued.length - 1] = `${prev.replace(/\[\s*\$?\s*$/, "[ $ ]")} ${rest[1]}`;
    } else glued.push(text);
  }

  const out: Out[] = [];
  for (const text of glued) {
    const heading = /^\|/.test(text) || /\$\s*\|\s*$/.test(text);
    let clean = text
      .replace(MILESTONE, " ")
      .replace(/\[\s*\$\s*\]/g, SALLA)
      .replace(/\^/g, " ")
      .replace(/\$/g, " ")
      .replace(/\|/g, " ");
    // "[ 31 ]" (once "31 ]", once "[ 487 [") opens a report; inside a block, only before a chain.
    clean = squeeze(clean)
      .replace(/^\[?\s*(\d{1,3})\s*[\][]\s*/, "$1 - ")
      .replace(/\[\s*(\d{1,3})\s*\]\s*(?=(?:حدثنا|أخبرنا|ثنا|وحدثنا|قال|حدثني))/g, "$1 - ");
    if (!clean) continue;
    const report = /(?:^|\s)\d{1,3} - /.test(clean);
    if (heading && !report && clean.length <= 200 && !/حدثنا|أخبرنا/.test(clean)) {
      out.push({ level: /^(?:بسم الله الرحمن الرحيم )?الجزء/.test(clean) ? 1 : 2, text: clean });
    } else out.push({ level: 0, text: clean });
  }
  return render(lines.slice(0, end + 1), out);
}

// Fada'il al-Qur'an of Abu 'Ubayd (JK011565): the export is a stream of
// records, each ended by a "PageV..P.." marker (records, not printed pages);
// a record is a report ("N - "), a heading or the editor's title. The blessing
// formulas are letters of the symbol font: A, B (with the pronoun after it:
// "Bه", "Bها"), C and D. Footnotes of the modern editor follow "__________"
// at the end of a record and are left out.
const FORMULAS: [RegExp, string][] = [
  [/(^|[\s(«])A(?=$|[\s.,،؛:)»])/g, `$1${SALLA}`],
  [/(^|[\s(«])B(ه|ها|هم|هما)(?=$|[\s.,،؛:)»])/g, "$1رضي الله عن$2"],
  [/(^|[\s(«])C(?=$|[\s.,،؛:)»])/g, "$1رحمه الله"],
  [/(^|[\s(«])D(?=$|[\s.,،؛:)»])/g, "$1عز وجل"],
];

export function decodeFormulas(text: string) {
  return FORMULAS.reduce((t, [pattern, words]) => t.replace(pattern, words), text);
}

export function fadailToAnnotated(source: string) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = header(lines);
  const stream = blocks(lines.slice(end + 1)).join(" ");
  const out: Out[] = [];
  for (const record of stream.split(/PageV\d+P\d+/)) {
    const text = squeeze(decodeFormulas(record.split("__________")[0].replace(MILESTONE, " ")));
    if (!text) continue;
    if (/^\d{1,4} - /.test(text)) out.push({ level: 0, text });
    else if (text.length <= 200 && /^(?:هذا )?(?:جملة|جماع)\s|^كتاب /.test(text)) out.push({ level: 1, text });
    else if (text.length <= 200 && /^باب |^حروف /.test(text)) out.push({ level: 2, text });
    else out.push({ level: 0, text });
  }
  return render(lines.slice(0, end + 1), out);
}
