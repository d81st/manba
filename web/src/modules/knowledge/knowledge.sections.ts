import { getMessages } from "@/shared/i18n";

const t = getMessages().knowledge.sections;

// The sections of the site that hold the topics, terms and links on the map.
// A topic joins the section of its category; every term joins the glossary.
export const SECTIONS = [
  { id: "section:topics", href: "/topics", label: t.topics, hint: t.topicsHint },
  { id: "section:hard", href: "/topics?category=hard", label: t.hard, hint: t.hardHint },
  { id: "section:sira", href: "/sira", label: t.sira, hint: t.siraHint },
  { id: "section:quran-text", href: "/quran-text", label: t.quranText, hint: t.quranTextHint },
  { id: "section:cities", href: "/cities", label: t.cities, hint: t.citiesHint },
  { id: "section:origins", href: "/origins", label: t.origins, hint: t.originsHint },
  { id: "section:science", href: "/science", label: t.science, hint: t.scienceHint },
  { id: "section:glossary", href: "/glossary", label: t.glossary, hint: t.glossaryHint },
] as const;

// The section node a topic of this category joins.
export function sectionOfCategory(category: string): string {
  switch (category) {
    case "hard":
      return "section:hard";
    case "sira":
      return "section:sira";
    case "quran_text":
      return "section:quran-text";
    case "cities":
      return "section:cities";
    case "testimony":
      return "section:origins";
    case "science":
    case "science_claims":
      return "section:science";
    default:
      return "section:topics";
  }
}
