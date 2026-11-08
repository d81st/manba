import { describe, expect, it } from "vitest";
import { withDrafts } from "@/shared/auth/preview-path";

describe("withDrafts", () => {
  it("adds the flag, keeping a query and a hash", () => {
    expect(withDrafts("/sira")).toBe("/sira?drafts=1");
    expect(withDrafts("/history#uthman")).toBe("/history?drafts=1#uthman");
    expect(withDrafts("/tests?level=1")).toBe("/tests?level=1&drafts=1");
  });

  it("leaves a path that already asks for drafts", () => {
    expect(withDrafts("/origins/eye-for-eye?drafts=1")).toBe("/origins/eye-for-eye?drafts=1");
    expect(withDrafts("/tests?level=1&drafts=1#q-3")).toBe("/tests?level=1&drafts=1#q-3");
  });
});
