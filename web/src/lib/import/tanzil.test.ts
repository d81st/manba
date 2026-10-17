import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTanzil, QURAN_AYAHS, QURAN_SURAS } from "./tanzil";

// Synthetic files in the Tanzil format. The words are made up (dictionary
// words), not source text; the counts are shrunk via the constants check below.
function textXml(suras: { ayahs: string[]; bismillah?: string }[]) {
  const body = suras
    .map(
      (sura, i) =>
        `<sura index="${i + 1}" name="س${i + 1}">` +
        sura.ayahs
          .map(
            (text, j) =>
              `<aya index="${j + 1}" text="${text}"${j === 0 && sura.bismillah ? ` bismillah="${sura.bismillah}"` : ""} />`,
          )
          .join("") +
        "</sura>",
    )
    .join("");
  return `<?xml version="1.0"?><!-- Tanzil Quran Text (Uthmani, Version 1.1) License: Creative Commons Attribution 3.0 --><quran>${body}</quran>`;
}

function metaXml(counts: number[], extra = "") {
  const suras = counts
    .map(
      (ayas, i) =>
        `<sura index="${i + 1}" ayas="${ayas}" name="س${i + 1}" tname="S${i + 1}" ename="Test ${i + 1}" type="${i % 2 ? "Medinan" : "Meccan"}" order="${i + 1}" />`,
    )
    .join("");
  return `<?xml version="1.0"?><quran type="metadata" version="1.0" copyright="(C) test" license="cc-by"><suras>${suras}</suras>${extra}</quran>`;
}

describe("parseTanzil on synthetic data", () => {
  it("refuses a file without the copyright notice", () => {
    expect(() => parseTanzil("<quran></quran>", metaXml([1]))).toThrow(/copyright notice/);
  });

  it("refuses a wrong number of suras", () => {
    const text = textXml([{ ayahs: ["كَلِمَة"] }]);
    expect(() => parseTanzil(text, metaXml([1]))).toThrow(/expected 114 suras/);
  });
});

describe("parseTanzil on the real files", () => {
  const dir = join(__dirname, "..", "..", "..", "..", "data", "sources", "tanzil");
  const data = parseTanzil(
    readFileSync(join(dir, "quran-uthmani.xml"), "utf8"),
    readFileSync(join(dir, "quran-data.xml"), "utf8"),
  );

  it("keeps the license notice and version", () => {
    expect(data.notice).toContain("CHANGING IT IS NOT ALLOWED");
    expect(data.textVersion).toBe("1.1");
    expect(data.metaNotice).toContain("cc-by");
  });

  it("has every sura and ayah of the Kufan count", () => {
    expect(data.suras).toHaveLength(QURAN_SURAS);
    expect(data.segments.filter((s) => s.level === "ayah")).toHaveLength(QURAN_AYAHS);
    expect(data.suras.reduce((sum, s) => sum + s.ayahs, 0)).toBe(QURAN_AYAHS);
  });

  it("stores the basmala as N.0 except for suras 1 and 9", () => {
    const basmalas = data.segments.filter((s) => s.level === "basmala").map((s) => s.address);
    expect(basmalas).toHaveLength(112);
    expect(basmalas).not.toContain("quran.1.0");
    expect(basmalas).not.toContain("quran.9.0");
    expect(basmalas).toContain("quran.2.0");
  });

  it("numbers segments in reading order without gaps", () => {
    const ordinals = data.segments.map((s) => s.ordinal);
    expect(ordinals).toEqual(ordinals.map((_, i) => i + 1));
    const i = data.segments.findIndex((s) => s.address === "quran.2.0");
    expect(data.segments[i - 1].address).toBe("quran.1.7");
    expect(data.segments[i + 1].address).toBe("quran.2.1");
  });

  it("keeps the text exactly as in the file", () => {
    const raw = readFileSync(join(dir, "quran-uthmani.xml"), "utf8");
    // No XML escapes in the file, so parsing returns every text byte for byte.
    expect(raw).not.toContain("&");
    for (const s of data.segments.filter((x) => x.level === "ayah").slice(0, 50)) {
      expect(raw).toContain(`text="${s.text}"`);
    }
  });

  it("reads the structural divisions", () => {
    const count = (scheme: string) => data.divisions.filter((d) => d.scheme === scheme).length;
    expect(count("juz")).toBe(30);
    expect(count("hizb_quarter")).toBe(240);
    expect(count("manzil")).toBe(7);
    expect(count("ruku")).toBe(556);
    expect(count("page")).toBe(604);
  });
});
