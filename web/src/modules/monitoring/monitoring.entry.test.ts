import { describe, expect, it } from "vitest";
import { clientErrorEntry, MAX, pagePath, serverErrorEntry } from "./monitoring.entry";

describe("journal of site errors", () => {
  it("keeps the page without its query and anchor", () => {
    expect(pagePath("/assistant?q=%D8%B5%D9%84%D8%A7%D8%A9")).toBe("/assistant");
    expect(pagePath("/quran/2#2-255")).toBe("/quran/2");
    expect(pagePath("https://example.com/x")).toBe("");
    expect(pagePath(42)).toBe("");
  });

  it("turns what Next.js reports into a row", () => {
    const error = Object.assign(new Error("relation does not exist"), { digest: "123456" });
    const entry = serverErrorEntry(error, { path: "/topics/x?drafts=1", method: "GET" }, { routePath: "/topics/[slug]" });
    expect(entry).toMatchObject({
      kind: "server",
      route: "/topics/[slug]",
      path: "/topics/x",
      method: "GET",
      digest: "123456",
      message: "relation does not exist",
    });
    expect(entry.stack).toContain("relation does not exist");
    expect(serverErrorEntry("plain", { path: "/", method: "POST" }, { routePath: "/" }).message).toBe("plain");
  });

  it("checks what the browser sends and cuts it to the limits", () => {
    expect(clientErrorEntry({ message: "  " })).toBeNull();
    expect(clientErrorEntry({})).toBeNull();
    const entry = clientErrorEntry({ message: "x".repeat(5000), path: "/library?q=1", stack: { evil: true } });
    expect(entry?.message).toHaveLength(MAX.message);
    expect(entry?.path).toBe("/library");
    expect(entry?.stack).toBe("");
  });
});
