import { describe, expect, it } from "vitest";
import { checkEventInput, checkPersonInput, checkPlaceInput, quoteFound, splitForms } from "./sira-input.ts";

// Fictional test data: not real events, quotes or dates.
const event = {
  slug: "test-event",
  kind: "expedition",
  status: "draft",
  title: "Вымышленное событие",
  dates: [
    { ref: "Вакиди 1:2", quote: "نص تجريبي", holder: "", year: 2, month: 9, day: 17, age: null, variant: false, note: "" },
  ],
};

describe("checkEventInput", () => {
  it("reads the references of the dates", () => {
    const { input, problems } = checkEventInput(event);
    expect(problems).toEqual([]);
    expect(input?.dates[0].address).toBe("maghazi_waqidi.1.2");
  });

  it("reports what is wrong", () => {
    expect(checkEventInput({ ...event, dates: [{ ...event.dates[0], ref: "Вакиди" }] }).problems).toEqual([
      { field: "dates.0.ref", code: "ref", detail: "Вакиди" },
    ]);
    expect(checkEventInput({ ...event, dates: [{ ...event.dates[0], month: null }] }).problems).toEqual([
      { field: "dates.0.day", code: "dayWithoutMonth" },
    ]);
    expect(checkEventInput({ ...event, dates: [{ ...event.dates[0], year: 0 }] }).problems[0].field).toBe("dates.0.year");
    expect(checkEventInput({ ...event, status: "published", dates: [] }).problems).toEqual([
      { field: "dates", code: "datesRequired" },
    ]);
    expect(checkEventInput({ ...event, slug: "Плохой" }).problems[0]).toEqual({ field: "slug", code: "slug" });
  });
});

describe("checkPersonInput", () => {
  it("splits the forms of a name and checks the relations", () => {
    const person = {
      slug: "test-person",
      status: "draft",
      name: "Вымышленный человек",
      nameAr: "فلان",
      forms: "فلان\nأبو فلان, فلان",
      relations: [{ other: "someone", kind: "uncle", direction: "out", ref: "Ибн Хишам 1:179b", quote: "نص", note: "", status: "draft" }],
    };
    const { input, problems } = checkPersonInput(person);
    expect(problems).toEqual([]);
    expect(input?.forms).toEqual(["فلان", "أبو فلان"]);
    expect(input?.relations[0].address).toBe("ibn_hisham.1.179.2");
    expect(checkPersonInput({ ...person, relations: [{ ...person.relations[0], other: "test-person" }] }).problems).toEqual([
      { field: "relations.0.other", code: "self" },
    ]);
  });
});

describe("checkPlaceInput", () => {
  it("wants both coordinates and their source", () => {
    const place = { slug: "test-place", name: "Вымышленное место", nameAr: "مكان", lat: 21.4, lon: 39.8, coordSource: "" };
    expect(checkPlaceInput(place).problems).toEqual([{ field: "coordSource", code: "coordSource" }]);
    expect(checkPlaceInput({ ...place, lon: null }).problems).toEqual([{ field: "lat", code: "coordsPair" }]);
    expect(checkPlaceInput({ ...place, lat: null, lon: null }).problems).toEqual([]);
  });
});

describe("helpers", () => {
  it("splits forms and finds quotes", () => {
    expect(splitForms(" أ ، ب\n\nأ ")).toEqual(["أ", "ب"]);
    expect(quoteFound("قال   فلان\nكذا", "فلان كذا")).toBe(true);
    expect(quoteFound("قال فلان", "علان")).toBe(false);
  });
});
