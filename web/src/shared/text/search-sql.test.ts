import { describe, expect, it } from "vitest";
import { matchConditions } from "./search-sql.ts";

describe("matchConditions", () => {
  it("searches the plain form only for a query without vowels", () => {
    expect(matchConditions("t", ["%قال%", "%نبي%"], false, 2)).toEqual({
      sql: "t.search_plain LIKE $2 AND t.search_plain LIKE $3",
      params: ["%قال%", "%نبي%"],
    });
  });

  it("finds candidates by letters, then checks the vowels on the text", () => {
    expect(matchConditions("m", ["%قَالَ%"], true, 1, true)).toEqual({
      sql: "m.search_plain LIKE $1 AND search_key(m.content, true) LIKE $2 AND search_indexed(m.version_id)",
      params: ["%قال%", "%قَالَ%"],
    });
  });
});
