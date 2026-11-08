import { LinkedParagraphs } from "@/shared/content/linked-text";
import { getMessages } from "@/shared/i18n";
import type { Finding } from "../finding.types";
import { leadHost } from "../finding.validation";

const t = getMessages().notFoundInSources;

// «Не найдено в источниках»: checked leads whose text is not where they say it
// is, with where it was searched. The lead is named by its site only, not linked.
export function NotFoundList({ findings }: { findings: Finding[] }) {
  return (
  <ul className="mt-6 space-y-4">
    {findings.map((f) => (
      <li key={f.id} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr]">
          <dt className="text-sm text-muted-foreground">{t.claimed}</dt>
          <dd className="font-medium">{f.claimedSource}</dd>
          <dt className="text-sm text-muted-foreground">{t.words}</dt>
          <dd dir="auto" className="whitespace-pre-line">
            {f.claimedText}
          </dd>
          <dt className="text-sm text-muted-foreground">{t.searched}</dt>
          <dd className="text-sm">
            <LinkedParagraphs text={f.searched} />
          </dd>
          {f.note && (
            <>
              <dt className="text-sm text-muted-foreground">{t.note}</dt>
              <dd className="text-sm">
                <LinkedParagraphs text={f.note} />
              </dd>
            </>
          )}
          <dt className="text-sm text-muted-foreground">{t.checked}</dt>
          <dd className="text-sm">
            {f.updatedAt}
            {leadHost(f.leadUrl) && (
              <span className="text-muted-foreground">
                {" "}
                · {t.lead}: {leadHost(f.leadUrl)}
              </span>
            )}
          </dd>
        </dl>
      </li>
    ))}
  </ul>
  );
}
