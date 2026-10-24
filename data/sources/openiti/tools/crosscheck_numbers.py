"""Cross-check of hadith numbers in a loaded file ("# N text" or "# N - text",
as in the JK exports and the Musnad of Ahmad) against a second
digitisation of the same edition (a Shamela export where a number stands on
its own line: "### | 12 - " or "### ||| ١٢ - ", with the text after it).

Usage: python3 -I crosscheck_numbers.py <work id> <loaded JK file> <second copy>

For every number found in both files, the first words of the first
narration are compared (normalised Arabic). Prints Markdown for the report.
"""
import difflib
import re
import sys

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def words(text, n=6):
    text = re.sub(r"ms\d+|PageV\d+P\d+|\\\s*\d*\s*\\|\*|@Q[BE]@", " ", text)
    text = re.sub(r"[ً-ْٰـ]", "", text)
    text = re.sub(r"[أإآ]", "ا", text).replace("ة", "ه").replace("ى", "ي")
    text = re.sub(r"[^ء-ي\s]", " ", text)
    out = [re.sub(r"^(و?)ابن$", r"\1بن", w) for w in text.split()]
    out = [w for w in out if w != "م"] if out[:1] == ["م"] else out
    return " ".join(out[:n])


def loaded(path):
    """Number -> text of its first narration in the JK export."""
    first, pending, current = {}, None, None
    for line in open(path, encoding="utf8"):
        line = line.rstrip("\n")
        marker = re.match(r"^### \|\|\| (\d+)(?:\s+ms\d+)?\s*$", line)
        if marker:
            pending = int(marker.group(1))
            continue
        if line.startswith("#"):
            current = None
            text = line[2:] if line.startswith("# ") and not line.startswith("# |") else None
            if text is None:
                continue
            if pending is not None:
                number, body = pending, text
            else:
                m = re.match(r"^(?:•\s*)?(\d{1,5})(?:\s*-)? (.*)$", text)
                if not m or m.group(2).startswith(("باب", "كتاب")):
                    continue
                number, body = int(m.group(1)), m.group(2)
            pending = None
            if number not in first:
                current = first[number] = [body]
        elif line.startswith("~~") and current is not None:
            current.append(line[2:])
    return {n: " ".join(t) for n, t in first.items()}


def second(path):
    out, number, current = {}, None, None
    for line in open(path, encoding="utf8"):
        line = line.rstrip("\n")
        m = re.match(r"^### \|+ ([0-9٠-٩]+) -", line)
        if m:
            number = int(m.group(1).translate(ARABIC_DIGITS))
            current = None
            continue
        if line.startswith("### |"):
            if re.match(r"^### \|+ \[ص:", line):
                continue
            number, current = None, None
            continue
        if line.startswith("# ") and number is not None and number not in out:
            current = out[number] = [line[2:]]
        elif (line.startswith("~~") or line.startswith("# ")) and current is not None:
            current.append(line[2:])
    return {n: " ".join(t) for n, t in out.items()}


work, mine, other = sys.argv[1], loaded(sys.argv[2]), second(sys.argv[3])
both = sorted(set(mine) & set(other))


def same_start(a, b):
    """The same text, allowing a few words more at the start of either copy
    (a heading or "قال أبو عيسى" printed with the number in one of them)."""
    if difflib.SequenceMatcher(None, words(a), words(b)).ratio() >= 0.6:
        return True
    long_a, long_b = words(a, 14), words(b, 14)
    return words(b, 4) in long_a or words(a, 4) in long_b


differ = [n for n in both if not same_start(mine[n], other[n])]
only_mine = sorted(set(mine) - set(other))
print(f"- Номеров в загруженном файле: {len(mine)}; во второй копии: {len(other)}; в обеих: {len(both)}.")
print(f"- Начало текста совпадает: {len(both) - len(differ)}; не совпадает: {len(differ)}.")
if only_mine:
    print(f"- Номера, которых нет во второй копии ({len(only_mine)}): {', '.join(map(str, only_mine[:60]))}{' …' if len(only_mine) > 60 else ''}.")
if differ:
    print()
    print("| Адрес | Начало в загруженном файле | Начало во второй копии |")
    print("| --- | --- | --- |")
    for n in differ:
        print(f"| `{work}.{n}` | {words(mine[n])} | {words(other[n])} |")
