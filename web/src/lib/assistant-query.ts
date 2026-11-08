// «Ассистент по источникам» (docs/PLAN.md, migration 024): the analysis of a
// question asked in ordinary words. No database here, so everything is
// unit-tested; the widening by the glossary and the synonyms and the search
// are in lib/assistant.ts.
import { searchKey } from "./arabic.ts";
import { plainKey } from "./plain-key.ts";
import { parseRefs } from "@/lib/refs";

export const MAX_QUESTION = 300;
const MAX_WORDS = 8;

const ARABIC = /[؀-ۿ]/;
const CYRILLIC = /[а-я]/;

// Words that carry no subject (in the search form of plain-key.ts: й -> и).
const STOP_RU = new Set(
  (
    "что как о об обо про в во на и а но или ли же бы по с со у к ко из за от до для при без над под это этот эта эти " +
    "тот та те то там тут был была были было есть быть будет его ее их им ему она он они оно мне меня мы вы ты я " +
    "кто где когда почему зачем какои какая какое какие каков сколько чем чего кого кому чему ком " +
    "говорится говорит говорят сказано написано сказал пишут пишет считается считают значит означает " +
    "расскажи расскажите покажи покажите наиди наидите объясни объясните хочу знать можно нужно ли " +
    "все всех всего весь вся также тоже еще уже только очень более менее про " +
    // particles of Arabic names: "Ибн Сина" is found by "сина"
    "ибн бин бинт абу аль ал ас ат ад ан ар аз уль"
  ).split(" "),
);
const STOP_AR = new Set(["في", "من", "على", "عن", "الى", "إلى", "ما", "هل", "او", "أو", "ثم", "ان", "أن", "إن", "لا", "قال"].map((w) => searchKey(w)));

// Endings of Russian words, longest first: "джизье" and "джизья" share "джиз".
const ENDINGS = [
  "иями", "ями", "ами", "иях", "ией", "ого", "его", "ому", "ему", "ыми", "ими",
  "ях", "ах", "ов", "ев", "еи", "ии", "ыи", "ои", "ая", "яя", "ое", "ее", "ие", "ые", "ом", "ем", "ам", "ям",
  "ую", "юю", "ия", "ья", "ье", "ью", "ию", "иы",
  "а", "я", "о", "е", "и", "ы", "у", "ю", "ь",
];

// The stem of a Russian word (in search form): its ending cut, three letters kept.
export function stemRu(word: string) {
  for (const ending of ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 3) return word.slice(0, -ending.length);
  }
  return word;
}

export type QuestionWord = { text: string; script: "ru" | "ar" | "other"; key: string };
export type Analysis = { refs: string[]; words: QuestionWord[] };

// "что говорится о джизье в 9:29" -> the reference 9:29 and the word "джизье"
// (stem "джиз"); Arabic words keep their search form without vowels.
export function analyzeQuestion(input: string): Analysis {
  const question = input.trim().slice(0, MAX_QUESTION);
  // References written in the question ("2:255", "Бухари 1", "Ибн Хишам 1:235"):
  // a number, with up to four words before it naming a book or a collection.
  const refs: string[] = [];
  const tokens = question.split(/\s+/).filter(Boolean);
  const used = new Set<number>();
  tokens.forEach((token, i) => {
    const number = token.replace(/[,.;!?»)]+$/, "");
    if (!/^\d{1,5}(?:[:.]\d{1,4}(?:[-–]\d{1,3})?[a-zа-я]?)?$/.test(number)) return;
    for (let j = Math.max(0, i - 4); j <= i; j++) {
      const candidate = [...tokens.slice(j, i), number].join(" ");
      const parsed = parseRefs(candidate);
      if (parsed.addresses.length && parsed.invalid.length === 0) {
        refs.push(...parsed.addresses);
        for (let k = j; k <= i; k++) used.add(k);
        return;
      }
    }
  });
  const rest = tokens.filter((_, i) => !used.has(i)).join(" ");
  const words: QuestionWord[] = [];
  for (const token of rest.split(/[\s,.;:!?«»"()\-–—]+/).filter(Boolean)) {
    if (ARABIC.test(token)) {
      const key = searchKey(token);
      if (key.length >= 2 && !STOP_AR.has(key)) words.push({ text: token, script: "ar", key });
      continue;
    }
    const plain = plainKey(token);
    if (!plain || /^\d+$/.test(plain)) continue;
    if (CYRILLIC.test(plain)) {
      if (STOP_RU.has(plain) || plain.length < 3) continue;
      words.push({ text: token, script: "ru", key: stemRu(plain) });
    } else if (plain.length >= 3) {
      words.push({ text: token, script: "other", key: plain });
    }
  }
  const seen = new Set<string>();
  return {
    refs: [...new Set(refs)],
    words: words.filter((w) => (seen.has(w.key) ? false : (seen.add(w.key), true))).slice(0, MAX_WORDS),
  };
}

// Whether a word of the question names a text (a glossary term, a synonym):
// every word of the name is matched by a word of the question, by stem.
export function namesMatch(name: string, words: QuestionWord[]) {
  const nameWords = plainKey(name)
    .split(" ")
    .filter((w) => w && !STOP_RU.has(w))
    .map(stemRu);
  if (nameWords.length === 0) return false;
  const keys = words.filter((w) => w.script !== "ar").map((w) => w.key);
  return nameWords.every((n) => keys.some((k) => k === n || (k.length >= 4 && n.startsWith(k)) || (n.length >= 4 && k.startsWith(n))));
}

// The anonymous record of a question with no answer: its words, sorted.
export function missKey(analysis: Analysis) {
  return analysis.words
    .map((w) => w.key)
    .sort()
    .join(" ")
    .slice(0, 200);
}

// The synonym form (admin): the phrase in search form, the forms one per line
// or separated by commas.
export function checkSynonymInput(raw: { phrase: string; forms: string; note: string }) {
  const phrase = raw.phrase.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").slice(0, 100);
  const forms = [...new Set(raw.forms.split(/[\n,،;]+/).map((f) => f.trim()).filter(Boolean))].slice(0, 30);
  const problems: { field: string; code: string }[] = [];
  if (!phrase) problems.push({ field: "phrase", code: "phrase" });
  if (forms.length === 0) problems.push({ field: "forms", code: "forms" });
  return { input: { phrase, forms, note: raw.note.trim().slice(0, 500) }, problems };
}
