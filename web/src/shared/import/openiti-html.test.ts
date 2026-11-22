import { describe, expect, it } from "vitest";
import { stripTags } from "./openiti-html.ts";

// Fictional test data in the layout of the OpenITI exports: not real text.
describe("stripTags", () => {
  it("drops stray span tags and keeps the words", () => {
    expect(stripTags("# </span>نص تجريبي.</span>")).toEqual({ text: "# نص تجريبي.", removed: 2 });
  });

  it("drops a link whose opening tag runs over lines, keeping its text in the paragraph", () => {
    const source = ['# قال: <a class="quran"', '~~href="http://example.org/1" target="_blank"', '~~title="تجربة">﴿نص﴾</a> (1).'].join("\n");
    expect(stripTags(source)).toEqual({ text: "# قال: ﴿نص﴾ (1).", removed: 2 });
  });

  it("leaves other angle brackets alone", () => {
    expect(stripTags("# أ < ب").text).toBe("# أ < ب");
  });
});
