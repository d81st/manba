import Link from "next/link";
import { getMessages, plural } from "@/shared/i18n";
import { Reveal } from "@/shared/ui/reveal";
import type { TopicVersions, VersionCell } from "../../topic.types";

const t = getMessages().topics;

// «Версии рядом»: the points where the reports disagree, a row each, and the
// positions as columns. Only quotations of the positions below, each with its
// place; an empty cell is the source's silence, not an answer. A wide screen
// gets a table whose question column stays in place while it scrolls
// sideways; a phone, one card per point.
export function VersionsSection({ versions }: { versions: TopicVersions }) {
  return (
    <Reveal id="versions" title={t.versions} count={plural(versions.rows.length, t.counts.questions)}>
      <p className="mb-3 text-sm text-muted-foreground">{t.versionsHint}</p>

      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="sticky start-0 z-10 w-40 bg-card px-3 py-2 text-start font-medium text-muted-foreground">
                {t.versionsPoint}
              </th>
              {versions.columns.map((column) => (
                <th key={column.holder} scope="col" className="min-w-48 border-s px-3 py-2 text-start align-bottom font-medium">
                  <a href={`#${column.anchor}`}>{column.holder}</a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {versions.rows.map((row) => (
              <tr key={row.label} className="border-b last:border-b-0">
                <th scope="row" className="sticky start-0 z-10 bg-card px-3 py-3 text-start align-top font-medium">
                  {row.label}
                </th>
                {row.cells.map((cell, k) => (
                  <td key={versions.columns[k].holder} className="border-s px-3 py-3 align-top">
                    <Cell cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="space-y-3 md:hidden">
        {versions.rows.map((row) => (
          <li key={row.label} className="rounded-xl border bg-card p-3">
            <p className="font-medium">{row.label}</p>
            <dl className="mt-2 space-y-3">
              {row.cells.map((cell, k) => (
                <div key={versions.columns[k].holder}>
                  <dt className="text-sm text-muted-foreground">
                    <a href={`#${versions.columns[k].anchor}`}>{versions.columns[k].holder}</a>
                  </dt>
                  <dd className="mt-1">
                    <Cell cell={cell} />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function Cell({ cell }: { cell: VersionCell | null }) {
  if (!cell) return <span className="text-muted-foreground">— {t.versionsSilent}</span>;
  return (
    <>
      <Link href={cell.href} title={t.quoteLink} className="quote-link">
        <bdi dir="rtl" lang="ar" className="ar text-base leading-loose">
          {cell.quote}
        </bdi>
      </Link>
      <span className="mt-1 block text-xs text-muted-foreground">{cell.ref}</span>
    </>
  );
}
