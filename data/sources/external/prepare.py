# Prepares the texts of other religions for the library («внешние источники»,
# docs/PLAN.md, «Истоки и связи»): one TSV per text version, "address<TAB>text",
# addresses in the scheme of docs/ADDRESSES.md (tanakh.<book>.<chapter>.<verse>,
# nt.<book>.<chapter>.<verse>, mishnah.<tractate>.<chapter>.<mishnah>).
#
# Usage: python3 -I prepare.py <download dir>
# The download dir must hold (see README.md for where each comes from):
#   sefaria-books.json                         index of the Sefaria export
#   tanakh/<Sefaria title>.json                "Tanach with Nikkud" of each book
#   mishnah/<Sefaria title>.json               "Mishnah, ed. Romm, Vilna 1913"
#   pre/pre.json                               "Pirke DeRabbi Eliezer, Sefaria Vocalized Edition"
#   sblgnt/<code>.txt                          SBLGNT text files
#   RusSynodal.json                            scrollmapper/bible_databases
import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = Path(sys.argv[1])
BOOKS = json.loads((HERE.parents[2] / "web" / "src" / "lib" / "external-books.json").read_text())


def write(name, rows):
    with open(HERE / name, "w", encoding="utf-8") as f:
        for address, text in rows:
            assert "\t" not in text and "\n" not in text, address
            f.write(f"{address}\t{text}\n")
    print(f"{name}: {len(rows)} texts")


def clean(text):
    text = re.sub(r"<[^>]+>", "", text)  # Sefaria marks words with <b>, <small>, …
    text = text.replace("&nbsp;", " ").replace("&thinsp;", " ")
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", text)).strip()


# Hebrew Bible: Tanach with Nikkud (tanach.us, Westminster Leningrad Codex), public domain.
tanakh = []
counts = {}  # book -> verse counts per chapter, to align the Russian translation
for book in BOOKS["tanakh"]:
    data = json.loads((SRC / "tanakh" / f"{book['sefaria']}.json").read_text())
    assert data["license"] == "Public Domain", book
    counts[book["n"]] = []
    for c, chapter in enumerate(data["text"], 1):
        counts[book["n"]].append(len(chapter))
        for v, verse in enumerate(chapter, 1):
            text = clean(verse)
            assert text, (book["sefaria"], c, v)
            tanakh.append((f"tanakh.{book['n']}.{c}.{v}", text))
write("tanakh-he.tsv", tanakh)

# Mishnah, ed. Romm, Vilna 1913 (Sefaria), public domain.
mishnah = []
for tractate in BOOKS["mishnah"]:
    data = json.loads((SRC / "mishnah" / f"{tractate['sefaria']}.json").read_text())
    assert data["license"] == "Public Domain", tractate
    for c, chapter in enumerate(data["text"], 1):
        for m, text in enumerate(chapter, 1):
            text = clean(text)
            if text:
                mishnah.append((f"mishnah.{tractate['n']}.{c}.{m}", text))
write("mishnah-he.tsv", mishnah)

# Pirkei de-Rabbi Eliezer, Sefaria Vocalized Edition, public domain: one
# book (1), chapters and paragraphs as in that edition.
pre = []
data = json.loads((SRC / "pre" / "pre.json").read_text())
assert data["license"] == "Public Domain"
for c, chapter in enumerate(data["text"], 1):
    for p, text in enumerate(chapter, 1):
        text = clean(text)
        if text:
            pre.append((f"pre.1.{c}.{p}", text))
write("pre-he.tsv", pre)

# Greek New Testament: SBLGNT (CC BY 4.0). Critical signs of the edition
# (⸀⸁⸂⸃⸄⸅) mark readings of its apparatus, which is not loaded.
nt = []
greek_keys = set()
for book in BOOKS["nt"]:
    lines = (SRC / "sblgnt" / f"{book['sblgnt']}.txt").read_text().splitlines()
    for line in lines[1:]:
        if not line.strip():
            continue
        ref, text = line.split("\t")
        m = re.fullmatch(rf"{re.escape(book['sblgnt'])} (\d+):(\d+)", ref)
        assert m, line
        text = clean(re.sub("[⸀⸁⸂⸃⸄⸅]", "", text))
        key = (book["n"], int(m[1]), int(m[2]))
        greek_keys.add(key)
        nt.append(("nt.%d.%d.%d" % key, text))
write("nt-grc.tsv", nt)

# Russian Synodal translation (1876, public domain), as given by
# scrollmapper/bible_databases with the Synodal chapter and verse numbers.
synodal = {b["name"]: b for b in json.loads((SRC / "RusSynodal.json").read_text())["books"]}


def synodal_chapters(name):
    return [[clean(v["text"]) for v in ch["verses"]] for ch in synodal[name]["chapters"]]


def align(hebrew_counts, chapters):
    """Pairs Hebrew (chapter, verse) with Synodal verses. Chapters are walked in
    order on both sides; where the verse counts differ (a verse or a psalm is
    numbered in the next chapter), the shortest run of chapters with equal
    totals is aligned verse by verse. A run longer than four chapters on
    either side means the texts differ (Greek additions in Daniel, Esther):
    those chapters are left without the translation."""
    out, skipped = {}, []
    i = j = 0
    while i < len(hebrew_counts) and j < len(chapters):
        hi, sj, h_total, s_total = i, j, hebrew_counts[i], len(chapters[j])
        while h_total != s_total and hi - i < 4 and sj - j < 4:
            if h_total < s_total and hi + 1 < len(hebrew_counts):
                hi += 1
                h_total += hebrew_counts[hi]
            elif sj + 1 < len(chapters):
                sj += 1
                s_total += len(chapters[sj])
            else:
                break
        if h_total != s_total:
            skipped.append(i + 1)
            i, j = i + 1, j + 1
            continue
        russian = [v for ch in chapters[j : sj + 1] for v in ch]
        hebrew = [(c + 1, v + 1) for c in range(i, hi + 1) for v in range(hebrew_counts[c])]
        out.update(zip(hebrew, russian))
        i, j = hi + 1, sj + 1
    skipped += list(range(i + 1, len(hebrew_counts) + 1))
    return out, skipped


# Chapters the counts cannot align are aligned by the standard versification
# mappings of the Copenhagen Alliance (data CC BY-SA 4.0): rso.json says which
# verse of the original (org) each Synodal verse is. A chapter is aligned only
# where org has the same verses as our Hebrew text; Synodal verses with no
# Hebrew counterpart (the Greek additions in Daniel 3) stay out.
USFM = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU", "Joshua": "JOS",
    "Judges": "JDG", "I Samuel": "1SA", "II Samuel": "2SA", "I Kings": "1KI", "II Kings": "2KI", "Isaiah": "ISA",
    "Jeremiah": "JER", "Ezekiel": "EZK", "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
    "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC",
    "Malachi": "MAL", "Psalms": "PSA", "Proverbs": "PRO", "Job": "JOB", "Song of Solomon": "SNG", "Ruth": "RUT",
    "Lamentations": "LAM", "Ecclesiastes": "ECC", "Esther": "EST", "Daniel": "DAN", "Ezra": "EZR", "Nehemiah": "NEH",
    "I Chronicles": "1CH", "II Chronicles": "2CH",
}
RSO = json.loads((SRC / "versification" / "rso.json").read_text())
ORG = json.loads((SRC / "versification" / "org.json").read_text())


def expand(ref):
    """'PSA 142:0-12' -> ('PSA', [(142, 0), …, (142, 12)]); a part of a verse
    ('1a') counts as the verse."""
    book, rest = ref.split(" ")
    chapter, verses = re.sub(r"(?<=\d)[a-z]", "", rest).split(":")
    a, _, b = verses.partition("-")
    return book, [(int(chapter), v) for v in range(int(a), int(b or a) + 1)]


def by_mapping(code, chapters):
    """org (chapter, verse) -> Synodal verse text, for the whole book."""
    to_org = {}
    for left, right in RSO["mappedVerses"].items():
        lbook, lverses = expand(left)
        rbook, rverses = expand(right)
        if lbook != code:
            continue
        for k, synodal_verse in enumerate(lverses):
            # A range mapped onto one verse (verses joined) keeps its first verse only.
            target = rverses[k] if k < len(rverses) else None
            to_org[synodal_verse] = target if rbook == code else None
    out = {}
    for c, chapter in enumerate(chapters, 1):
        for v, text in enumerate(chapter, 1):
            target = to_org.get((c, v), (c, v))
            if target and target[1] > 0 and target not in out:
                out[target] = text
    return out


tanakh_ru, report, mapped = [], {}, {}
for book in BOOKS["tanakh"]:
    chapters = synodal_chapters(book["synodal"])
    pairs, skipped = align(counts[book["n"]], chapters)
    code = USFM[book["synodal"]]
    org_max = ORG["maxVerses"].get(code, [])
    rescued = []
    for c in skipped:
        if c - 1 < len(org_max) and int(org_max[c - 1]) == counts[book["n"]][c - 1]:
            table = by_mapping(code, chapters)
            got = {(c, v): table[(c, v)] for v in range(1, counts[book["n"]][c - 1] + 1) if (c, v) in table}
            if got:
                pairs.update(got)
                rescued.append(c)
    if rescued:
        mapped[book["ru"]] = rescued
    skipped = [c for c in skipped if c not in rescued]
    if skipped:
        report[book["ru"]] = skipped
    for (c, v), text in sorted(pairs.items()):
        if text:
            tanakh_ru.append((f"tanakh.{book['n']}.{c}.{v}", text))
write("tanakh-ru.tsv", tanakh_ru)
print("Hebrew chapters aligned by the versification mappings:", json.dumps(mapped, ensure_ascii=False))
print("Hebrew chapters without the Synodal text:", json.dumps(report, ensure_ascii=False))

# New Testament: the Synodal verse numbers are those of the Greek, except a
# few places (Rom 16:25-27 stands at 14:24-26); a verse goes in only where the
# Greek edition has that verse.
nt_ru, dropped = [], 0
for book in BOOKS["nt"]:
    for c, chapter in enumerate(synodal_chapters(book["synodal"]), 1):
        for v, text in enumerate(chapter, 1):
            if (book["n"], c, v) in greek_keys and text:
                nt_ru.append((f"nt.{book['n']}.{c}.{v}", text))
            else:
                dropped += 1
write("nt-ru.tsv", nt_ru)
print("Synodal NT verses with no Greek verse of that number:", dropped)

# Spot checks of the alignment (Hebrew numbers on the left).
ru = dict(tanakh_ru)
for address, words in [
    ("tanakh.27.37.29", "Праведники наследуют землю"),  # Ps 37:29 = Synodal 36:29
    ("tanakh.2.21.24", "глаз за глаз"),
    ("tanakh.16.3.1", "излию от Духа Моего"),  # Joel 3:1 = Synodal 2:28
    ("tanakh.26.3.23", "Илию пророка"),  # Malachi 3:23 = Synodal 4:5
    ("tanakh.3.5.20", "И сказал Господь Моисею"),  # Lev 5:20 = Synodal 6:1
    ("tanakh.12.42.3", "трости надломленной"),  # Isaiah 42:3
    # Aligned by the versification mappings:
    ("tanakh.27.142.8", "Выведи из темницы душу мою"),  # Ps 142:8 = Synodal 141:7
    ("tanakh.35.3.24", "изумился"),  # Dan 3:24 = Synodal 3:91 (3:24-90 are the Greek additions)
    ("tanakh.37.7.68", "верблюдов четыреста тридцать пять"),  # Neh 7:68 = Synodal 7:69
    ("tanakh.30.1.2", "Да лобзает он меня"),  # Song 1:2 = Synodal 1:1
    ("tanakh.12.64.1", "плавящего огня"),  # Isaiah 64:1 = Synodal 64:2
]:
    assert words in ru.get(address, ""), (address, ru.get(address))
print("Spot checks passed.")
