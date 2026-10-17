// Parses the Tanzil Quran text and metadata files into rows for the library.
// Every check here runs before anything is written to the database.
import { XMLParser } from "fast-xml-parser";

export const QURAN_SURAS = 114;
export const QURAN_AYAHS = 6236; // Kufan count, as in the Hafs mushaf

export type Segment = {
  address: string;
  level: "ayah" | "basmala";
  ordinal: number;
  text: string;
};

export type Sura = {
  number: number;
  address: string;
  names: { ar: string; translit: string; en: string };
  ayahs: number;
  revelationPlace: "meccan" | "medinan";
  revelationOrder: number;
};

export type Division = { scheme: string; number: number; startsAt: string };

export type TanzilData = {
  notice: string; // copyright block of the text file, verbatim
  textVersion: string;
  metaNotice: string;
  metaVersion: string;
  suras: Sura[];
  segments: Segment[];
  divisions: Division[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  trimValues: false,
  isArray: (name) => ["sura", "aya", "juz", "quarter", "hizb", "manzil", "ruku", "page"].includes(name),
});

type Attrs = Record<string, string>;

function int(value: string | undefined, what: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`Tanzil: invalid ${what}: ${value}`);
  }
  return number;
}

// Divisions in quran-data.xml: <juzs><juz index sura aya/>...</juzs>
const DIVISION_SCHEMES: Record<string, { list: string; item: string }> = {
  juz: { list: "juzs", item: "juz" },
  hizb_quarter: { list: "hizbs", item: "quarter" },
  manzil: { list: "manzils", item: "manzil" },
  ruku: { list: "rukus", item: "ruku" },
  page: { list: "pages", item: "page" },
};

export function parseTanzil(textXml: string, metaXml: string): TanzilData {
  const notice = textXml.match(/<!--([\s\S]*?)-->/)?.[1].trim() ?? "";
  if (!notice.includes("Tanzil") || !notice.includes("Creative Commons")) {
    throw new Error("Tanzil: the copyright notice is missing from the text file");
  }
  const textVersion = notice.match(/Version\s+([\d.]+)/)?.[1] ?? "";

  const text = parser.parse(textXml).quran;
  const meta = parser.parse(metaXml).quran;
  const textSuras: Attrs[] = text?.sura ?? [];
  const metaSuras: Attrs[] = meta?.suras?.sura ?? [];

  if (textSuras.length !== QURAN_SURAS || metaSuras.length !== QURAN_SURAS) {
    throw new Error(
      `Tanzil: expected ${QURAN_SURAS} suras, got ${textSuras.length} (text) and ${metaSuras.length} (metadata)`,
    );
  }

  const suras: Sura[] = [];
  const segments: Segment[] = [];
  let ordinal = 0;

  textSuras.forEach((textSura, i) => {
    const number = i + 1;
    const metaSura = metaSuras[i];
    if (int(textSura.index, "sura index") !== number || int(metaSura.index, "sura index") !== number) {
      throw new Error(`Tanzil: suras out of order at position ${number}`);
    }
    const ayahs = (textSura as unknown as { aya: Attrs[] }).aya ?? [];
    if (ayahs.length !== int(metaSura.ayas, "ayah count")) {
      throw new Error(`Tanzil: sura ${number} has ${ayahs.length} ayahs, metadata says ${metaSura.ayas}`);
    }
    const type = metaSura.type?.toLowerCase();
    if (type !== "meccan" && type !== "medinan") {
      throw new Error(`Tanzil: sura ${number} has unknown type ${metaSura.type}`);
    }

    suras.push({
      number,
      address: `quran.${number}`,
      names: { ar: metaSura.name, translit: metaSura.tname, en: metaSura.ename },
      ayahs: ayahs.length,
      revelationPlace: type,
      revelationOrder: int(metaSura.order, "revelation order"),
    });

    // The basmala before a sura has no number in the Kufan count: address N.0.
    const basmala = ayahs[0]?.bismillah;
    if (basmala) {
      segments.push({ address: `quran.${number}.0`, level: "basmala", ordinal: ++ordinal, text: basmala });
    }
    ayahs.forEach((ayah, j) => {
      if (int(ayah.index, "ayah index") !== j + 1) {
        throw new Error(`Tanzil: ayahs out of order in sura ${number}`);
      }
      if (!ayah.text) throw new Error(`Tanzil: empty ayah ${number}:${j + 1}`);
      segments.push({ address: `quran.${number}.${j + 1}`, level: "ayah", ordinal: ++ordinal, text: ayah.text });
    });
  });

  const ayahCount = segments.filter((s) => s.level === "ayah").length;
  if (ayahCount !== QURAN_AYAHS) {
    throw new Error(`Tanzil: expected ${QURAN_AYAHS} ayahs, got ${ayahCount}`);
  }

  const known = new Set(segments.map((s) => s.address));
  const divisions: Division[] = [];
  for (const [scheme, { list, item }] of Object.entries(DIVISION_SCHEMES)) {
    const entries: Attrs[] = meta?.[list]?.[item] ?? [];
    entries.forEach((entry, i) => {
      const startsAt = `quran.${int(entry.sura, `${scheme} sura`)}.${int(entry.aya, `${scheme} ayah`)}`;
      if (int(entry.index, `${scheme} index`) !== i + 1 || !known.has(startsAt)) {
        throw new Error(`Tanzil: invalid ${scheme} ${entry.index} at ${startsAt}`);
      }
      divisions.push({ scheme, number: i + 1, startsAt });
    });
  }

  const metaNotice = [meta?.copyright, meta?.license && `License: ${meta.license}`]
    .filter(Boolean)
    .join(". ");
  return {
    notice,
    textVersion,
    metaNotice,
    metaVersion: String(meta?.version ?? ""),
    suras,
    segments,
    divisions,
  };
}
