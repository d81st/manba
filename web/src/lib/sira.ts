// The section «Жизнеописание пророка»: periods of the life of the prophet as
// ranges of the sections of the Sira of Ibn Hisham, in the book's own order
// (agreed with the author 25.10.2026). The section titles are Ibn Hisham's;
// only the grouping is ours. No database here.
export const SIRA_WORK = "ibn_hisham";

export const SIRA_PERIODS = [
  {
    from: 1,
    to: 41,
    title: "До рождения пророка: родословная, Мекка и Аравия",
  },
  { from: 42, to: 55, title: "Рождение и молодость, брак с Хадиджей" },
  {
    from: 56,
    to: 114,
    title: "Мекканский период: от первого откровения до переселения в Медину",
  },
  {
    from: 115,
    to: 185,
    title: "Мединский период: община, договоры и походы до Худайбии",
  },
  {
    from: 186,
    to: 258,
    title: "От Хайбара до прощального хаджа; перечень походов",
  },
  { from: 259, to: 264, title: "Болезнь, смерть и похороны" },
] as const;

export function periodOf(section: number) {
  return SIRA_PERIODS.findIndex((p) => section >= p.from && section <= p.to);
}
