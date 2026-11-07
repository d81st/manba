// «Нити историй» on the Quran map: the ayahs where a prophet or Maryam is
// named, found by searching the text (quran.ar.hafs-simple search form). This
// is what the text says, not an interpretation: a story often goes on in the
// next ayahs without the name, and the map says so. Names that are also common
// words in the folded search form (Hud "هودا" also means Jews, Salih also
// means righteous, Yahya folds into the verb "gives life") are left out.

export type Story = { slug: string; name: string; forms: string[] };

export const STORIES: Story[] = [
  { slug: "adam", name: "Адам", forms: ["ادم"] },
  { slug: "idris", name: "Идрис", forms: ["ادريس"] },
  { slug: "nuh", name: "Нух", forms: ["نوح"] },
  { slug: "ibrahim", name: "Ибрахим", forms: ["ابراهيم"] },
  { slug: "lut", name: "Лут", forms: ["لوط"] },
  { slug: "ismail", name: "Исмаил", forms: ["اسماعيل"] },
  { slug: "ishaq", name: "Исхак", forms: ["اسحاق"] },
  { slug: "yaqub", name: "Якуб", forms: ["يعقوب"] },
  { slug: "yusuf", name: "Юсуф", forms: ["يوسف"] },
  { slug: "shuayb", name: "Шуайб", forms: ["شعيب"] },
  { slug: "ayyub", name: "Айюб", forms: ["ايوب"] },
  { slug: "musa", name: "Муса", forms: ["موسي"] },
  { slug: "harun", name: "Харун", forms: ["هارون"] },
  { slug: "dawud", name: "Дауд", forms: ["داوود"] },
  { slug: "sulayman", name: "Сулейман", forms: ["سليمان"] },
  { slug: "yunus", name: "Юнус", forms: ["يونس"] },
  { slug: "zakariya", name: "Закария", forms: ["زكريا"] },
  { slug: "maryam", name: "Марьям", forms: ["مريم"] },
  { slug: "isa", name: "Иса", forms: ["عيسي"] },
];

export function storyBySlug(slug: string) {
  return STORIES.find((s) => s.slug === slug) ?? null;
}

// A whole word in the search form: with the joined particles و ف ب ل ك in front
// and the accusative alif after ("نوحا").
export function storyPattern(story: Story) {
  return `(^| )[وفبلك]{0,2}(${story.forms.join("|")})(ا)?( |$)`;
}

// The ayahs in the order of the text, for the line that joins them.
export function inTextOrder(addresses: string[]) {
  const key = (a: string) => a.split(":").map(Number);
  return [...addresses].sort((a, b) => {
    const [sa, aa] = key(a);
    const [sb, ab] = key(b);
    return sa - sb || aa - ab;
  });
}
