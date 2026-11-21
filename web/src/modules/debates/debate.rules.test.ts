import { describe, expect, it } from "vitest";
import { canSee, moveDepth, moveProblem, placeHref, treeOf, uncheckedIds } from "./debate.rules";
import { MAX_DEPTH, MAX_MOVES } from "./debate.validation";
import type { MoveKind } from "./debate.types";

const move = (id: number, parentId: number | null, author: string, kind: MoveKind) => ({ id, parentId, author, kind });

describe("who sees a debate", () => {
  const row = { status: "open" as const, createdBy: "ann", partner: "bob" };

  it("shows an open debate to its two participants and to an administrator", () => {
    expect(canSee(row, { login: "ann", role: "reader" })).toBe(true);
    expect(canSee(row, { login: "bob", role: "reader" })).toBe(true);
    expect(canSee(row, { login: "cara", role: "reader" })).toBe(false);
    expect(canSee(row, { login: "cara", role: "admin" })).toBe(true);
  });

  it("shows a published debate to any signed-in reader", () => {
    expect(canSee({ ...row, status: "published" }, { login: "cara", role: "reader" })).toBe(true);
  });
});

describe("the shape of a move", () => {
  const root = move(1, null, "ann", "question");

  it("makes the other person answer, and refuses an answer to an answer", () => {
    expect(moveProblem({ kind: "answer", parentId: 1 }, [root], "bob")).toBeNull();
    expect(moveProblem({ kind: "answer", parentId: 1 }, [root], "ann")).toBe("sameAuthor");
    const answer = move(2, 1, "bob", "answer");
    expect(moveProblem({ kind: "answer", parentId: 2 }, [root, answer], "ann")).toBe("parent");
    expect(moveProblem({ kind: "counter", parentId: 2 }, [root, answer], "ann")).toBeNull();
  });

  it("stops at the depth and length limits", () => {
    const chain = [root];
    for (let id = 2; id <= MAX_DEPTH; id++) chain.push(move(id, id - 1, id % 2 ? "ann" : "bob", "counter"));
    expect(moveDepth(MAX_DEPTH, chain)).toBe(MAX_DEPTH + 1);
    expect(moveProblem({ kind: "counter", parentId: MAX_DEPTH }, chain, "ann")).toBe("depth");
    const full = Array.from({ length: MAX_MOVES }, (_, i) => move(i + 1, i === 0 ? null : 1, "ann", i === 0 ? "question" : "counter"));
    expect(moveProblem({ kind: "counter", parentId: 1 }, full, "bob")).toBe("full");
  });
});

describe("addresses and the published record", () => {
  it("links a citation to the page of that fragment", () => {
    expect(placeHref("quran.2.255")).toBe("/quran/2#2-255");
    expect(placeHref("bukhari.3951")).toBe("/hadith/bukhari/3951");
    expect(placeHref("tafsir_ibn_kathir.2.255")).toBe("/library/tafsir_ibn_kathir/2.255");
  });

  it("lists cited moves that the moderator has not checked", () => {
    expect(
      uncheckedIds([
        { id: 1, address: null, verdict: null },
        { id: 2, address: "quran.2.255", verdict: null },
        { id: 3, address: "bukhari.1", verdict: "supports" },
      ]),
    ).toEqual([2]);
  });

  it("nests replies under their parent", () => {
    const tree = treeOf([
      { id: 2, parentId: 1, body: "ответ" },
      { id: 1, parentId: null, body: "вопрос" },
    ]);
    expect(tree.map((node) => node.body)).toEqual(["вопрос"]);
    expect(tree[0].children.map((node) => node.body)).toEqual(["ответ"]);
  });
});
