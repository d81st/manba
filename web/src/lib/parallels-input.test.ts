import { describe, expect, it } from "vitest";
import { externalLabel, formatExternalRefs, linkExternal, parseExternalRef } from "./external.ts";
import { checkParallelInput, parseAnyRefs } from "./parallels-input.ts";
import { plainKey } from "./plain-key.ts";

// Fictional test data: not a real link, basis or reading.
const link = {
  slug: "test-link",
  status: "draft",
  title: "Вымышленная связь",
  tradition: "judaism",
  kind: "retelling",
  degree: "parallel",
  basis: "text",
  islamRefs: "5:45",
  externalRefs: "Исход 21:23-25",
  basisRefs: "",
  basisNote: "",
  traditionReading: "",
  researchReading: "",
};

describe("parseExternalRef", () => {
  it("reads books by name, short form and machine address", () => {
    expect(parseExternalRef("Исход 21:23-25")).toEqual(["tanakh.2.21.23", "tanakh.2.21.24", "tanakh.2.21.25"]);
    expect(parseExternalRef("Пс 37:29")).toEqual(["tanakh.27.37.29"]);
    expect(parseExternalRef("От Матфея 5:38")).toEqual(["nt.1.5.38"]);
    expect(parseExternalRef("Матфея 5:38")).toEqual(["nt.1.5.38"]);
    expect(parseExternalRef("1 Царств 2:1")).toEqual(["tanakh.8.2.1"]);
    expect(parseExternalRef("1Цар 2:1")).toEqual(["tanakh.8.2.1"]);
    expect(parseExternalRef("Мишна Санхедрин 4:5")).toEqual(["mishnah.34.4.5"]);
    expect(parseExternalRef("tanakh.12.42.1-4")).toHaveLength(4);
  });
  it("refuses what is not a reference", () => {
    expect(parseExternalRef("Санхедрин 4:5")).toBeNull(); // a tractate only after «Мишна»
    expect(parseExternalRef("Бухари 3635")).toBeNull();
    expect(parseExternalRef("Исход 21:30-20")).toBeNull();
    expect(parseExternalRef("tanakh.99.1.1")).toBeNull();
  });
  it("writes references back", () => {
    expect(externalLabel("mishnah.34.4.5")).toBe("Мишна Санхедрин 4:5");
    expect(formatExternalRefs(["tanakh.2.21.23", "tanakh.2.21.24", "tanakh.2.21.25", "tanakh.3.24.20"])).toBe(
      "Исход 21:23-25, Левит 24:20",
    );
  });
});

describe("parseAnyRefs", () => {
  it("takes references of every kind", () => {
    const { addresses, invalid } = parseAnyRefs("5:45, Бухари 3635, Исход 21:24, нечто");
    expect(addresses).toEqual(["quran.5.45", "bukhari.3635", "tanakh.2.21.24"]);
    expect(invalid).toEqual(["нечто"]);
  });
});

describe("checkParallelInput", () => {
  it("accepts a draft with its references", () => {
    const { input, problems } = checkParallelInput(link);
    expect(problems).toEqual([]);
    expect(input?.refs.externalRefs).toHaveLength(3);
  });
  it("keeps each side to its own texts", () => {
    const { problems } = checkParallelInput({ ...link, islamRefs: "Исход 21:24", externalRefs: "5:45" });
    expect(problems.map((p) => p.code)).toEqual(["islamSide", "externalSide"]);
  });
  it("publishes only with a basis and both readings", () => {
    const { problems } = checkParallelInput({ ...link, status: "published", basis: "research" });
    expect(problems.map((p) => `${p.field}:${p.code}`)).toEqual([
      "basisNote:basisRequired",
      "basisNote:studyRequired",
      "traditionReading:required",
      "researchReading:required",
    ]);
  });
});

describe("plainKey", () => {
  it("drops vowel points and accents", () => {
    expect(plainKey("עַיִן תַּחַת עַיִן׃")).toBe("עין תחת עין");
    expect(plainKey("Ἐν ἀρχῇ ἦν ὁ λόγος,")).toBe("εν αρχη ην ο λογος");
    expect(plainKey("Ёлка — ель!")).toBe("елка ель");
  });
});

describe("linkExternal", () => {
  it("links verses of other religions' texts and leaves ayahs alone", () => {
    const pieces = linkExternal("Ср. 5:45 и Исход 21:23–25, Мишна Санхедрин 4:5.");
    expect(pieces).toEqual([
      { text: "Ср. 5:45 и " },
      { text: "Исход 21:23–25", href: "/external/tanakh/2/21#23" },
      { text: ", " },
      { text: "Мишна Санхедрин 4:5", href: "/external/mishnah/34/4#5" },
      { text: "." },
    ]);
  });
});
