"""Cross-check of the hadith numbers in Sahih Muslim (OpenITI JK000109-ara1,
the loaded text) against a second digitisation of the same edition
(OpenITI Shamela0001727-ara1, not stored here).

Usage: python3 -I crosscheck_muslim.py <JK000109-ara1> <Shamela0001727-ara1.mARkdown>

Narrations of both files are aligned by the first words of their chains
(normalised Arabic); where the Shamela file prints an edition number "(N)"
at the start of a narration, it is compared with the JK number.
Prints Markdown for muslim-numbering.md.
"""
import difflib
import re
import sys


def words(text, n=8):
    text = re.sub(r"ms\d+|PageV\d+P\d+|\\\s*\d*\s*\\|\*", " ", text)
    text = re.sub(r"[ً-ْٰـ]", "", text)
    text = re.sub(r"[أإآ]", "ا", text).replace("ة", "ه").replace("ى", "ي")
    text = re.sub(r"[^ء-ي\s]", " ", text)
    out = [re.sub(r"^(و?)ابن$", r"\1بن", w) for w in text.split()]
    return " ".join(out[:n])


def jk(path):
    items, variants, current = [], {}, None
    for line in open(path, encoding="utf8"):
        line = line.rstrip("\n")
        m = re.match(r"^# (\d+) (\d{1,4} )?(.*)$", line)
        if m and not m.group(3).startswith("باب"):
            number = int(m.group(2)) if len(m.group(1)) > 4 else int(m.group(1))
            variants[number] = variants.get(number, 0) + 1
            current = {"address": f"muslim.{number}.{variants[number]}", "number": number, "text": [m.group(3)]}
            items.append(current)
        elif line.startswith("~~") and current:
            current["text"].append(line[2:])
        elif line.startswith("#"):
            current = None if line.startswith("# |") else current
    return items


def shamela(path):
    items, current = [], None
    for line in open(path, encoding="utf8"):
        line = line.rstrip("\n")
        if line.startswith("### |"):
            current = None
            continue
        m = re.match(r"^### \$\s*(?:\d+\s*-?)?\s*(.*)$", line)
        rest = m.group(1) if m else (line[2:] if line.startswith("# ") else None)
        if rest is not None:
            p = re.match(r"#?\s*\((\d+)\)\s*(.*)", rest)
            if p:
                current = {"number": int(p.group(1)), "text": [p.group(2)]}
                items.append(current)
            elif m and rest.strip():
                current = {"number": None, "text": [rest]}
                items.append(current)
            elif current:
                current["text"].append(rest)
        elif line.startswith("~~") and current:
            current["text"].append(line[2:])
    return items


J, S = jk(sys.argv[1]), shamela(sys.argv[2])
jk_keys = [words(" ".join(x["text"])) for x in J]
sh_keys = [words(" ".join(x["text"])) for x in S]
pairs = {}
matcher = difflib.SequenceMatcher(None, jk_keys, sh_keys, autojunk=False)
for a, b, n in matcher.get_matching_blocks():
    for k in range(n):
        pairs[a + k] = b + k
for tag, i1, i2, j1, j2 in matcher.get_opcodes():
    if tag == "replace" and i2 - i1 == j2 - j1:
        for k in range(i2 - i1):
            if difflib.SequenceMatcher(None, jk_keys[i1 + k], sh_keys[j1 + k]).ratio() > 0.6:
                pairs[i1 + k] = j1 + k

compared, differ = 0, []
for i, j in sorted(pairs.items()):
    other = S[j]["number"]
    if other is None:
        continue
    compared += 1
    if other != J[i]["number"]:
        differ.append((J[i]["address"], J[i]["number"], other))

print(f"- Передач в загруженном файле: {len(J)}; во второй копии: {len(S)}.")
print(f"- Сопоставлено по началу цепочки: {len(pairs)}.")
print(f"- Номер есть в обеих копиях: {compared}; совпадает: {compared - len(differ)}; расходится: {len(differ)}.")
print()
print("| Адрес | Номер в загруженном файле | Номер во второй копии |")
print("| --- | --- | --- |")
for address, mine, other in differ:
    print(f"| `{address}` | {mine} | {other} |")
