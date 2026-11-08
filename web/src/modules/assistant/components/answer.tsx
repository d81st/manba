import Link from "next/link";
import { TranslationText } from "@/components/translation-text";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";
import type { AssistantResult, SourceHit } from "../assistant.types";
import { AnswerGraph } from "./answer-graph";
import { Examples } from "./ask-form";

const t = getMessages().assistant;

// What the assistant found: the words it searched for (widened by the glossary
// and synonyms), then the pages of the site and the fragments of the sources,
// as a list or as a graph. No text of its own.
export function Answer({
  result,
  view,
  href,
}: {
  result: AssistantResult;
  view: "list" | "graph";
  href: (patch: Record<string, string>) => string;
}) {
  const total = result.quran.length + result.hadith.length + result.pages.length;
  const widened = result.concepts.flatMap((c) => c.ar.filter((a) => a !== c.label));
  return (
    <>
      {(result.concepts.length > 0 || result.analysis.refs.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {t.words}:
          {result.concepts.map((c, i) => (
            <Badge key={i} variant="secondary">
              {c.label}
            </Badge>
          ))}
          {widened.length > 0 && (
            <>
              <span>· {t.widened}:</span>
              {widened.map((a) => (
                <bdi key={a} dir="rtl" lang="ar" className="ar text-base text-foreground">
                  {a}
                </bdi>
              ))}
            </>
          )}
        </div>
      )}
      {total === 0 ? (
        <>
          <p className="mt-6">{t.nothing}</p>
          <Examples />
        </>
      ) : (
        <>
          <nav className="mt-4 flex gap-2 text-sm">
            {(["list", "graph"] as const).map((v) => (
              <Link
                key={v}
                href={href({ view: v })}
                className={cn(
                  "rounded-full border px-3 py-1 no-underline",
                  view === v ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                )}
              >
                {v === "list" ? t.list : t.graph}
              </Link>
            ))}
          </nav>
          {view === "graph" ? (
            <section className="mt-4">
              <p className="mb-2 text-sm text-muted-foreground">{t.graphHint}</p>
              <div className="overflow-x-auto rounded-xl border bg-card p-3">
                <AnswerGraph result={result} />
              </div>
            </section>
          ) : (
            <div className="mt-4 space-y-8">
              {result.pages.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.pages}</h2>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {result.pages.map((p) => (
                      <li key={p.href}>
                        <Link
                          href={p.href}
                          className="flex h-full flex-col gap-1 rounded-xl border bg-card p-3 text-card-foreground no-underline hover:border-primary hover:bg-accent"
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{p.title}</span>
                            <Badge variant="outline">{t.kinds[p.kind]}</Badge>
                          </span>
                          {p.hint && <span className="text-sm text-muted-foreground">{p.hint}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <Sources title={t.quran} hits={result.quran} />
              <Sources title={t.hadith} hits={result.hadith} />
            </div>
          )}
        </>
      )}
    </>
  );
}

function Sources({ title, hits }: { title: string; hits: SourceHit[] }) {
  if (hits.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <ol className="border-t">
        {hits.map((s) => (
          <li key={s.address} className="flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-baseline sm:gap-4">
            <Link href={s.href} className="min-w-28 shrink-0 text-xs tabular-nums text-muted-foreground no-underline">
              {s.label}
              <span className="block">{s.title}</span>
              {s.level !== null && <span className="block">{t.level.replace("{n}", String(s.level))}</span>}
              {s.concepts.length > 1 && <span className="block">{t.matched.replace("{n}", String(s.concepts.length))}</span>}
            </Link>
            <div className="flex-1 space-y-1">
              <p className={cn("ar leading-loose", s.address.startsWith("quran.") ? "quran text-xl" : "text-lg")} lang="ar" dir="rtl">
                {s.text.length > 700 ? `${s.text.slice(0, 700).replace(/\s+\S*$/, "")} …` : s.text}
              </p>
              {s.translation && (
                <p className="text-sm" lang="ru">
                  <TranslationText content={s.translation} />
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
