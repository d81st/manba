import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";

const t = getMessages().admin;

const VARIANTS = { draft: "outline", review: "secondary", published: "default", retired: "outline" } as const;

export function StatusBadge({ status }: { status: string }) {
  const key = status as keyof typeof t.statuses;
  return (
    <Badge variant={VARIANTS[key] ?? "outline"} className={key === "retired" ? "text-muted-foreground line-through" : ""}>
      {t.statuses[key] ?? status}
    </Badge>
  );
}
