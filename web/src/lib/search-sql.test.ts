import { describe, expect, it } from "vitest";
import { matchConditions } from "./search-sql.ts";

describe("matchConditions", () => {
  it("searches the plain form only for a query without vowels", () => {
    expect(matchConditions("t", ["%قال%", "%نبي%"], false, 2)).toEqual({
      sql: "t.search_plain LIKE $2 AND t.search_plain LIKE $3",
      params: ["%قال%", "%نبي%"],
    });
  });

  it("finds candidates by letters, then checks the vowels", () => {
    expect(matchConditions("m", ["%قَالَ%"], true, 1)).toEqual({
      sql: "m.search_plain LIKE $1 AND m.search_vocalized LIKE $2",
      params: ["%قال%", "%قَالَ%"],
    });
  });
});
