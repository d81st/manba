"""Finds texts of different hadith collections that share their wording.

Input: a TSV of `address <TAB> work <TAB> search text` (the `search_plain`
column of `texts`, see README.md). Output: `a <TAB> b <TAB> share` for every
pair whose share is at least MIN_SHARE, sorted, with a < b.

The result is a measure of shared wording, not a claim that two texts are
one hadith. Method (version 1):
- the chain of narrators is dropped: only the text after the first blessing
  formula is compared (the whole text when there is none);
- a text is the set of its pairs of neighbouring words;
- pairs of words found in more than MAX_DF texts are formulas, not wording,
  and do not make two texts candidates;
- share = word pairs in common / word pairs of the shorter text.
"""
import collections
import re
import sys

MIN_SHARE = 0.6
MIN_COMMON = 5
MAX_DF = 400
FORMULA = re.compile(r"صلي الله عليه وسلم|صلي الله عليه واله|عليه السلام|عليهما السلام")


def text_after_chain(text):
    text = re.sub(r"\s+", " ", re.sub(r"[^ء-ي ]", " ", text))
    found = FORMULA.search(text)
    body = text[found.end():] if found else text
    return [w for w in FORMULA.sub(" ", body).split() if len(w) > 1]


def main(path):
    rows = []
    for line in open(path, encoding="utf-8"):
        address, work, text = line.rstrip("\n").split("\t", 2)
        words = text_after_chain(text)
        rows.append((address, work, {f"{x} {y}" for x, y in zip(words, words[1:])}))

    df = collections.Counter(g for _, _, grams in rows for g in grams)
    index = collections.defaultdict(list)
    for i, (_, _, grams) in enumerate(rows):
        for g in grams:
            if 2 <= df[g] <= MAX_DF:
                index[g].append(i)

    candidates = collections.Counter()
    for ids in index.values():
        for x in range(len(ids)):
            for y in range(x + 1, len(ids)):
                if rows[ids[x]][1] != rows[ids[y]][1]:
                    candidates[(ids[x], ids[y])] += 1

    out = []
    for (i, j), rare in candidates.items():
        if rare < MIN_COMMON:
            continue
        common = len(rows[i][2] & rows[j][2])
        share = common / min(len(rows[i][2]), len(rows[j][2]))
        if share >= MIN_SHARE:
            a, b = sorted((rows[i][0], rows[j][0]))
            out.append((a, b, f"{share:.2f}"))
    out.sort()
    sys.stdout.write("".join("\t".join(row) + "\n" for row in out))
    print(f"{len(rows)} texts, {len(out)} pairs", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
