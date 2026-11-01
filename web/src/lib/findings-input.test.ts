import { describe, expect, it } from "vitest";
import { checkFindingInput, leadHost } from "./findings-input";

// A made-up lead for the test (not a real finding).
const finding = { status: "new", claimedSource: "Тестовый сборник, № 1", claimedText: "вымышленный текст" };

describe("checkFindingInput", () => {
  it("accepts a new lead", () => {
    expect(checkFindingInput(finding).problems).toEqual([]);
  });

  it("reads where a confirmed text is", () => {
    const { input, problems } = checkFindingInput({ ...finding, status: "confirmed", found: "Бухари 1" });
    expect(problems).toEqual([]);
    expect(input?.foundAddress).toBe("bukhari.1");
    expect(checkFindingInput({ ...finding, status: "confirmed" }).problems[0].code).toBe("foundRequired");
  });

  it("publishes only a checked «not found» with where it was searched", () => {
    const codes = (raw: object) => checkFindingInput({ ...finding, ...raw }).problems.map((p) => p.code);
    expect(codes({ status: "not_found" })).toEqual(["searchedRequired"]);
    expect(codes({ status: "checking", public: true })).toEqual(["publicNotFound"]);
    expect(codes({ status: "not_found", searched: "где искали", public: true, claimedText: "" })).toEqual(["claimedTextRequired"]);
    expect(codes({ status: "not_found", searched: "где искали", public: true })).toEqual([]);
  });

  it("checks the link and the date", () => {
    expect(checkFindingInput({ ...finding, leadUrl: "not a link" }).problems[0].field).toBe("leadUrl");
    expect(checkFindingInput({ ...finding, leadDate: "01.11.2026" }).problems[0].field).toBe("leadDate");
  });
});

describe("leadHost", () => {
  it("names the site of a lead", () => {
    expect(leadHost("https://www.youtube.com/watch?v=x")).toBe("youtube.com");
    expect(leadHost("")).toBe("");
  });
});
