import Link from "next/link";
import { getMessages } from "@/shared/i18n";
import type { Mention } from "../debate.types";

// Published disputes that cited this fragment. Nothing is drawn when there are none.
export function DebateMentions({ debates }: { debates: Mention[] }) {
  if (debates.length === 0) return null;
  const t = getMessages().debates;
  return (
    <p className="text-sm break-words text-muted-foreground">
      {t.mentioned}{" "}
      {debates.map((debate, index) => (
        <span key={debate.id}>
          {index > 0 && ", "}
          <Link href={`/debates/${debate.id}`} dir="auto">
            {debate.question}
          </Link>
        </span>
      ))}
    </p>
  );
}
