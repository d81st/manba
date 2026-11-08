import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";

const t = getMessages().topics;

// The category badge of a topic. In the list every category but «general» has
// one; on the topic page the section categories link to their section page.
export function TopicBadge({ category, linked = false }: { category: string; linked?: boolean }) {
  if (category === "hard") return <Badge variant="secondary">{t.hardBadge}</Badge>;
  if (linked) {
    const section = SECTIONS[category];
    if (!section) return null;
    return (
      <Link href={section.href} className="no-underline">
        <Badge variant="outline">{section.label}</Badge>
      </Link>
    );
  }
  if (category === "science_claims") return <Badge variant="secondary">{t.scienceClaimsBadge}</Badge>;
  const label = LIST_LABELS[category];
  return label ? <Badge variant="outline">{label}</Badge> : null;
}

const SECTIONS: Record<string, { href: string; label: string }> = {
  quran_text: { href: "/quran-text", label: t.quranTextBadge },
  sira: { href: "/sira", label: t.siraBadge },
  cities: { href: "/cities", label: t.citiesBadge },
  testimony: { href: "/origins#testimonies", label: t.testimonyBadge },
};

const LIST_LABELS: Record<string, string> = {
  quran_text: t.quranTextBadge,
  sira: t.siraBadge,
  cities: t.citiesBadge,
  testimony: t.testimonyBadge,
  science: t.scienceBadge,
};
