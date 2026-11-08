import { LinkedParagraphs } from "@/shared/content/linked-text";
import { Badge } from "@/shared/ui/badge";
import { getMessages } from "@/shared/i18n";
import type { PublicParallel } from "../parallel.types";
import { RefItems } from "./ref-items";

const t = getMessages().origins;

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

// One link: both texts side by side, its kind, degree and basis, and both
// readings of the likeness with their sources. The site draws no conclusion.
export function ParallelArticle({ p }: { p: PublicParallel }) {
  const reading = (text: string, note: string, items: PublicParallel["basisItems"]) =>
    text ? (
      <>
        <LinkedParagraphs text={text} />
        <RefItems items={items} className="mt-3" />
        {note && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t.notInLibrary}: {note}
          </p>
        )}
      </>
    ) : (
      <p className="text-sm text-muted-foreground">{t.notWritten}</p>
    );

  return (
    <>
    <header className="mt-3 border-b pb-4">
      <h1 className="text-2xl font-semibold">{p.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
        <Badge variant="secondary">{t.traditions[p.tradition as keyof typeof t.traditions]}</Badge>
        <Badge variant="secondary">{t.kinds[p.kind as keyof typeof t.kinds]}</Badge>
        <Badge variant="outline" title={t.degreeHints[p.degree as keyof typeof t.degreeHints]}>
          {t.degrees[p.degree as keyof typeof t.degrees]}
        </Badge>
        {p.status !== "published" && <Badge variant="outline">{t.draft}</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t.degreeHints[p.degree as keyof typeof t.degreeHints]}</p>
    </header>

    <div className="grid gap-x-8 lg:grid-cols-2">
      <section>
        <Heading>{t.islam}</Heading>
        <RefItems items={p.islamItems} />
      </section>
      <section>
        <Heading>{t.external}</Heading>
        <RefItems items={p.externalItems} />
      </section>
    </div>

    <Heading>
      {t.basis}: {t.bases[p.basis as keyof typeof t.bases]}
    </Heading>
    {p.basisNote && (
      <LinkedParagraphs text={p.basisNote} />
    )}
    <RefItems items={p.basisItems} className="mt-3" />

    <Heading>{t.readings}</Heading>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-4 text-card-foreground">
        <h3 className="mb-2 font-semibold">{t.tradition}</h3>
        {reading(p.traditionReading, p.traditionNote, p.traditionItems)}
      </section>
      <section className="rounded-xl border bg-card p-4 text-card-foreground">
        <h3 className="mb-2 font-semibold">{t.research}</h3>
        {reading(p.researchReading, p.researchNote, p.researchItems)}
      </section>
    </div>
    <div className="mb-10" />
    </>
  );
}
