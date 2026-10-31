"""Sablukov's Russian Quran translation (Kazan, 1894, 2nd ed.) from Wikisource,
rearranged into the Hafs (Kufan) ayah numbering.

    python3 -I prepare.py PAGES_DIR TANZIL_FILE OUT_TSV

PAGES_DIR holds the raw wikitext of the proofread pages
"Страница:Коран - Г.С. Саблуков, 1894 г., 2-е издание.djvu/<n>" as <n>.txt.
TANZIL_FILE is Tanzil's "ru.sablukov" (txt-2, "sura|ayah|text"); it is used only
to find where Kufan ayah boundaries fall inside Sablukov's verses (he numbers
verses after Flügel). No text is taken from it. See README.md.

Output: "address<TAB>text" per line, quran.<sura>.<ayah> and quran.<sura>.0 for
the basmala. Markup in the text: {words} - words the translator added (italic
in the edition), [[note]] - the translator's footnote.
"""

import difflib
import re
import sys
import unicodedata
from pathlib import Path

FIRST_PAGE, LAST_PAGE = 5, 534


# --- wikitext -------------------------------------------------------------


def split_args(body):
    """Top-level "|" split of a template body."""
    args, depth, start, i = [], 0, 0, 0
    while i < len(body):
        if body.startswith("{{", i):
            depth += 1
            i += 2
            continue
        if body.startswith("}}", i):
            depth -= 1
            i += 2
            continue
        if body[i] == "|" and depth == 0:
            args.append(body[start:i])
            start = i + 1
        i += 1
    args.append(body[start:])
    return args


def find_close(text, start):
    """Index just after the "}}" closing the template that opens at start."""
    depth, i = 0, start
    while i < len(text):
        if text.startswith("{{", i):
            depth += 1
            i += 2
        elif text.startswith("}}", i):
            depth -= 1
            i += 2
            if depth == 0:
                return i
        else:
            i += 1
    raise ValueError(f"unclosed template at {start}: {text[start:start + 60]!r}")


ACUTE = "́"
GRAVE = "̀"


def expand(text):
    """Templates -> plain text with verse markers "\x01S:V\x02"."""
    out, i = [], 0
    while True:
        j = text.find("{{", i)
        if j < 0:
            out.append(text[i:])
            break
        out.append(text[i:j])
        k = find_close(text, j)
        args = split_args(text[j + 2:k - 2])
        name, rest = args[0].strip(), args[1:]
        low = name.lower()
        if name in ("ВАР", "ВАР2"):  # old | modern orthography
            if len(rest) > 1:
                out.append(merge_layers(expand(rest[0]), expand(rest[1])))
            else:
                out.append(expand(rest[0]))
        elif name == "стих":
            out.append(f"\x01{rest[0].strip()}:{rest[1].strip()}\x02")
        elif low == "перенос":  # word hyphenated across pages: whole word here
            out.append(rest[0] + rest[1])
        elif low == "перенос2":  # ... and its second half on the next page
            pass
        elif low == "опечатка2":  # misprint | correction (Wikisource editors)
            out.append(expand(rest[1]))
        elif name == "акут":
            out.append(ACUTE)
        elif name == "гравис":
            out.append(GRAVE)
        elif name in ("sc", "ц", "right2"):
            out.append(expand(rest[0]) if rest else "")
        elif name == "мби":
            out.append(expand("".join(rest[1:])))
        elif name in ("nop", "нп", "^", "колонтитул", "разделитель", "примечания"):
            if name == "^":
                out.append("\n")
        else:
            raise ValueError(f"unknown template {name!r}")
        i = k
    return "".join(out)


# --- old orthography --------------------------------------------------------
# A few pages have only the old (pre-1918) orthography. They are brought to
# the modern one word by word with the pairs the Wikisource editors made on
# the other pages ({{ВАР|old|modern}}), and simple letter rules for words
# not seen there. README.md lists these pages.

OLD_WORD = re.compile(r"[А-Яа-яЁёѢѣІіѲѳѴѵҌҍ\u0301\u0300]+")


def letter_rules(w):
    w = w.translate(str.maketrans("ѣѢіІѳѲѵѴҍҌ", "еЕиИфФиИеЕ"))
    w = re.sub(r"(?<=[А-Яа-я])ъ$", "", w)
    w = re.sub(r"аго$", "ого", w)
    w = re.sub(r"яго$", "его", w)
    w = re.sub(r"^(И|и|Во|во|Ра|ра|Бе|бе|Ни|ни|Чре|чре|Чере|чере)з(?=[кпстфхцчшщ])", r"\1с", w)
    return w


def learn_pairs(raws):
    """old word -> modern word, from the pages that give both."""
    pairs = {}
    for raw in raws:
        i = 0
        while True:
            j = raw.find("{{ВАР|", i)
            if j < 0:
                break
            k = find_close(raw, j)
            args = split_args(raw[j + 2:k - 2])
            i = k
            if len(args) < 3:
                continue
            old, new = OLD_WORD.findall(args[1]), OLD_WORD.findall(args[2])
            if len(old) != len(new):
                continue
            for a, b in zip(old, new):
                # Only spelling pairs: the same word after the letter rules,
                # up to a letter or two (развѣ / разве, ея / ее).
                ruled = letter_rules(a)
                if a != b and ruled[:1].lower() == b[:1].lower() and (
                    ruled == b or difflib.SequenceMatcher(None, ruled, b).ratio() >= 0.8
                ):
                    pairs.setdefault(a, {}).setdefault(b, 0)
                    pairs[a][b] += 1
    return {a: max(bs, key=bs.get) for a, bs in pairs.items()}


# Old/modern word pairs that are spelling only, though the letters differ much.
SPELLING = {("оне", "они"), ("одне", "одни"), ("нея", "нее"), ("ея", "ее"), ("ней", "нее")}
PAIRS = {}  # filled by read_edition from all pages


def _key(w):
    return letter_rules(w).lower().replace("ё", "е").replace(ACUTE, "").replace(GRAVE, "")


def merge_layers(old, new):
    """The modern layer, except where it differs from the book in more than
    spelling (a word left out, "ни" for "не"): there the book's words,
    modernized, are taken. Printed for README.md."""
    ow, nw = list(OLD_WORD.finditer(old)), list(OLD_WORD.finditer(new))
    sm = difflib.SequenceMatcher(None, [_key(m.group()) for m in ow], [_key(m.group()) for m in nw], autojunk=False)
    patches = []
    for op, a1, a2, b1, b2 in sm.get_opcodes():
        if op == "equal":
            continue
        a_txt = " ".join(_key(m.group()) for m in ow[a1:a2])
        b_txt = " ".join(_key(m.group()) for m in nw[b1:b2])
        if (a_txt, b_txt) in SPELLING or (a_txt and b_txt and difflib.SequenceMatcher(None, a_txt, b_txt).ratio() >= 0.75):
            continue
        # Ordinal endings of the old headings ("Глава (2-ая)") are not text.
        if not b_txt and a_txt in ("я", "ая", "ия", "ья", "го"):
            continue
        # Only differences of letters and words count, not a stray accent.
        if re.sub(r"[^а-я ]", "", a_txt) == re.sub(r"[^а-я ]", "", b_txt):
            continue
        # Words the editors left out are spelled by the letter rules only: so
        # "покорные и покорныя" (men and women, 33:35) keeps the book's two forms.
        old_part = modernize(old[ow[a1].start():ow[a2 - 1].end()], PAIRS if b2 > b1 else {}) if a2 > a1 else ""
        if b2 > b1:
            start, end = nw[b1].start(), nw[b2 - 1].end()
        elif b1 > 0:  # words missing in the modern layer: after word b1 - 1
            start = end = nw[b1 - 1].end()
            old_part = " " + old_part
        else:
            start = end = nw[0].start() if nw else 0
            old_part = old_part + " "
        print(f"book over modern layer: {new[start:end]!r} -> {old_part.strip()!r}")
        patches.append((start, end, old_part))
    for start, end, text in reversed(patches):
        new = new[:start] + text + new[end:]
    return new


# Words the rules above get wrong (checked by hand on those pages).
OLD_WORDS = {"житейскія": "житейские"}


def modernize(text, pairs):
    table = {**pairs, **OLD_WORDS}
    return OLD_WORD.sub(lambda m: table.get(m.group(), letter_rules(m.group())), text)


def page_text(raw):
    raw = re.sub(r"<noinclude>.*?</noinclude>", "", raw, flags=re.S)
    raw = re.sub(r"<section (begin|end)=\"?\d+\"?\s*/>", "", raw)
    raw = re.sub(r"<div[^>]*>|</div>", "", raw)
    return raw


def wiki_to_marked(text):
    """Refs, italics and bold of the edition -> our markup."""
    text = re.sub(r"<ref[^>]*>(.*?)</ref>", lambda m: f"[[{m.group(1).strip()}]]", text, flags=re.S)
    text = re.sub(r"</?(big|small)>", "", text)
    text = text.replace("'''", "")
    text = re.sub(r"''(.*?)''", r"{\1}", text, flags=re.S)
    text = unicodedata.normalize("NFC", text)
    # Stress marks over vowels (что́) are kept; nothing else is changed.
    return text


# --- the edition: suras and Sablukov's verses -------------------------------

HEADER = re.compile(r"Глава \((\d+)(?:-\w+)?\)[^\n]*")

# Transcription slips of the Wikisource text that break the verse structure
# (the wording is never changed): (as transcribed, as read). Each must occur
# exactly once. Listed in README.md.
FIXES = [
    # The verse number 122 recognised as "12 У." (sura 20).
    (": 12 У. тогда кто последует", ": \x0120:122\x02 тогда кто последует"),
    # 42:1-2 are two ayahs in the Kufan count (ḥā mīm / ʿayn sīn qāf): the
    # translator's one note on the letters is split between them.
    ("Хм гск[[Х\u0463\u0301ръ мысл\u0463\u0301те; ", "Хм[[Х\u0463\u0301ръ мысл\u0463\u0301те.]] гск[["),
]


def apply_fixes(text):
    for wrong, right in FIXES:
        assert text.count(wrong) == 1, (wrong, text.count(wrong))
        text = text.replace(wrong, right)
    return text


def read_edition(pages_dir):
    raws = [(Path(pages_dir) / f"{n}.txt").read_text(encoding="utf-8") for n in range(FIRST_PAGE, LAST_PAGE + 1)]
    pairs = learn_pairs(raws)
    PAIRS.clear()
    PAIRS.update(pairs)
    pages = []
    for n, raw in zip(range(FIRST_PAGE, LAST_PAGE + 1), raws):
        text = expand(page_text(raw))
        if "{{ВАР" not in raw and text.strip():
            print(f"page {n}: old orthography only, modernized")
            text = modernize(text, pairs)
        pages.append(text)
    text = apply_fixes(wiki_to_marked("\n".join(pages)))
    heads = list(HEADER.finditer(text))
    assert [int(h.group(1)) for h in heads] == list(range(1, 115)), [h.group(1) for h in heads]
    suras = {}
    for idx, h in enumerate(heads):
        body = text[h.end():heads[idx + 1].start() if idx + 1 < len(heads) else len(text)]
        suras[int(h.group(1))] = split_sura(int(h.group(1)), body)
    return suras


def clean(s):
    s = re.sub(r"\s+", " ", s).strip()
    return s


def split_sura(number, body):
    parts = re.split(r"\x01(\d+):(\d+)\x02", body)
    head = parts[0]
    marks = [(int(parts[k]), int(parts[k + 1]), parts[k + 2]) for k in range(1, len(parts), 3)]
    verses = {}
    for idx, (s, v, t) in enumerate(marks):
        if s != number:  # "56|78" at the end of sura 55
            print(f"marker {s}:{v} read as {number}:{v}")
            s = number
            marks[idx] = (s, v, t)
        # A mistyped marker between two in sequence ("2|289" between 238 and
        # 240): the position decides. Reported, see README.md.
        prev = marks[idx - 1][1] if idx else 1
        nxt = marks[idx + 1][1] if idx + 1 < len(marks) else None
        if v != prev + 1 and nxt == prev + 2:
            print(f"marker {s}:{v} read as {s}:{prev + 1}")
            v = prev + 1
            marks[idx] = (s, v, t)
        assert v not in verses, (number, v)
        verses[v] = clean(t)
    # The head: place and verse count, basmala (not in sura 9), verse 1.
    head = clean(re.sub(r"</?center>", " ", head))
    place = re.match(r"^(Мекк|Медин)\w*[.:]\s*[^.]*?стих\w*[.:]\s*", head)
    assert place, (number, head[:80])
    head = head[place.end():]
    basmala = None
    m = re.match(r"^Во имя Бога[^.]*\.\s*", head)
    if m:
        basmala, head = clean(m.group()), head[m.end():]
    verses[1] = clean(head)
    expected = list(range(1, max(verses) + 1))
    # A verse number left as plain text (" 76 ") inside the previous verse.
    for v in expected:
        if v not in verses and v - 1 in verses:
            m = re.search(rf"\s{v},?\s", verses[v - 1])
            if m:
                print(f"plain number {number}:{v} split off")
                verses[v - 1], verses[v] = clean(verses[v - 1][:m.start()]), clean(verses[v - 1][m.end():])
    assert sorted(verses) == expected, (number, sorted(set(expected) - set(verses)))
    return {"basmala": basmala, "verses": [verses[v] for v in expected]}


# --- alignment with the Kufan numbering -----------------------------------

WORD = re.compile(r"[а-яёa-z0-9]+")


def words(s):
    s = re.sub(r"\[\[.*?\]\]", " ", s)
    s = unicodedata.normalize("NFD", s.lower().replace("ё", "е"))
    s = "".join(c for c in s if not unicodedata.combining(c))
    # Notes keep the old orthography (азъ, мыслѣте).
    s = s.translate(str.maketrans("ѣіѳѵѡќ", "еифиок"))
    return [re.sub(r"(?<=.)ъ$", "", w) for w in WORD.findall(s)]


def tokens(verses):
    """Sablukov's text as (word, position in the joined text) with the joined text."""
    joined = " ".join(verses)
    out = []
    # A note's words count too (Tanzil prints some notes in the text), but a
    # cut never falls inside a note: its words all end where the note ends.
    for m in re.finditer(r"[^\s\[]*\[\[.*?\]\][^\s]*|[^\s]+", joined):
        for w in words(m.group().replace("[[", " ").replace("]]", " ")):
            out.append((w, m.start(), m.end()))
    return joined, out


def balance(seg):
    """A cut may fall inside {added words}: close and reopen the braces."""
    depth = 0
    for c in seg:
        if c == "{":
            depth += 1
        elif c == "}" and depth:
            depth -= 1
    opened = seg.count("}") - seg.count("{")
    if opened > 0:  # starts inside braces
        seg = "{" * opened + seg
    return seg + "}" * depth if depth > 0 else seg


def align(number, sab, kufan):
    """Sablukov's verses of one sura -> texts for Kufan ayahs 1..n.

    kufan: Tanzil's verse texts of the same translation, Kufan numbering
    (for sura 1 the first is the basmala)."""
    joined, toks = tokens(sab)
    a = [t[0] for t in toks]
    b, ends = [], []
    for v in kufan:
        b.extend(words(v))
        ends.append(len(b))
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    # Map every position in b to a position in a.
    b2a = [None] * (len(b) + 1)
    exact = [False] * (len(b) + 1)
    for blk in sm.get_matching_blocks():
        for d in range(blk.size + 1):
            if blk.b + d <= len(b) and blk.size:
                b2a[blk.b + d] = blk.a + d
                exact[blk.b + d] = True
    last = 0
    for i in range(len(b2a)):
        if b2a[i] is None:
            b2a[i] = last
        last = b2a[i]
    b2a[len(b)] = len(a)
    # Boundaries of Sablukov's own verses, in word positions.
    own, pos = set(), 0
    for v in sab:
        pos += len(tokens([v])[1])
        own.add(pos)
    cuts = []
    for e in ends[:-1]:
        c = b2a[e]
        # Where the words around the boundary differ between the editions,
        # snap to Sablukov's own verse end when one is within two words.
        near = [x for x in own if abs(x - c) <= 2]
        c = c if exact[e] or not near else min(near, key=lambda x: abs(x - c))
        # A note standing alone before the first word (Tanzil leaves such
        # notes out) opens the next ayah.
        # A note followed by a mark (".", ",") belongs to the word before it.
        if 0 < c < len(a) and joined.startswith("[[", toks[c - 1][1]) and joined[toks[c - 1][2] - 2:toks[c - 1][2]] == "]]":
            group = toks[c - 1][1]
            while c > 0 and toks[c - 1][1] == group:
                c -= 1
        cuts.append(c)
    cuts.append(len(a))
    segs, prev_char, prev_word = [], 0, 0
    for c in cuts:
        end_char = toks[c - 1][2] if c > 0 else 0
        if c < len(a):
            # Keep punctuation and notes that follow the last word.
            nxt = toks[c][1]
            # (a note after a space opens the next verse: it stays there).
            m = re.match(r"[^\s\[]*(\[\[.*?\]\][^\s]*)?", joined[end_char:nxt])
            end_char += m.end() if m else 0
        else:
            end_char = len(joined)
        segs.append(balance(clean(joined[prev_char:end_char])))
        prev_char, prev_word = end_char, c
    ratios = []
    for seg, ref in zip(segs, kufan):
        ratios.append(difflib.SequenceMatcher(None, words(seg), words(ref), autojunk=False).ratio())
    return segs, ratios


def read_tanzil(path):
    suras = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        s, v, t = line.split("|", 2)
        suras.setdefault(int(s), {})[int(v)] = t
    return {s: [vs[k] for k in sorted(vs)] for s, vs in suras.items()}


def main(pages_dir, tanzil, out):
    edition = read_edition(pages_dir)
    kufan = read_tanzil(tanzil)
    assert sum(len(v) for v in kufan.values()) == 6236
    rows, weak, shifted = [], [], 0
    for s in range(1, 115):
        ed = edition[s]
        verses = list(ed["verses"])
        if s == 1:  # Sablukov leaves the basmala of sura 1 unnumbered
            verses = [ed["basmala"]] + verses
        segs, ratios = align(s, verses, kufan[s])
        if len(verses) != len(kufan[s]):
            shifted += 1
        if s not in (1, 9):
            rows.append((f"quran.{s}.0", ed["basmala"]))
        for n, (seg, r) in enumerate(zip(segs, ratios), 1):
            assert seg, (s, n)
            rows.append((f"quran.{s}.{n}", seg))
            if r < 0.6:
                weak.append((s, n, round(r, 2)))
    with open(out, "w", encoding="utf-8") as f:
        for a, t in rows:
            assert "\t" not in t and "\n" not in t
            f.write(f"{a}\t{t}\n")
    print(f"{len(rows)} rows, suras with another verse count: {shifted}")
    print(f"weak matches (<0.6): {len(weak)}", weak[:40])


if __name__ == "__main__":
    main(*sys.argv[1:4])
