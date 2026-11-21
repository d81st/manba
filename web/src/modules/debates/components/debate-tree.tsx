import Link from "next/link";
import { formatRefs } from "@/shared/addresses/refs";
import { getMessages } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import type { DebateQuote, MoveRow } from "../debate.types";
import { placeHref, treeOf, type TreeNode } from "../debate.rules";
import { CheckForm } from "./moderation-forms";

const t = getMessages().debates;

function levels(quote: DebateQuote) {
  const parts: string[] = [];
  if (quote.sunni) parts.push(t.sunni.replace("{n}", String(quote.sunni)));
  if (quote.shia) parts.push(t.shia.replace("{n}", String(quote.shia)));
  return parts.length > 0 ? parts.join(" · ") : t.noLevel;
}

function Move({
  node,
  debateId,
  moderate,
}: {
  node: TreeNode<MoveRow>;
  debateId: number;
  moderate: boolean;
}) {
  const label = node.address ? formatRefs([node.address]) : "";
  return (
    <li className="rounded-xl border bg-card p-4 text-card-foreground">
      <p className="text-xs text-muted-foreground">
        {t.kinds[node.kind]} · {node.author} · {node.createdAt} {t.at}
      </p>
      <p className="mt-2 break-words" dir="auto">
        {node.body}
      </p>
      {node.address && (
        <div className="mt-3">
          <p className="text-sm">
            <Link href={placeHref(node.address)}>{label || node.address}</Link>
            {node.quote && <span className="text-muted-foreground"> · {node.quote.title}</span>}
          </p>
          {node.quote && (
            <>
              <p className="mt-1 text-xs text-muted-foreground">{levels(node.quote)}</p>
              <blockquote
                className={`${node.address.startsWith("quran.") ? "quran" : "ar"} mt-2 text-xl leading-loose`}
                lang="ar"
                dir="rtl"
              >
                {node.quote.text}
              </blockquote>
              {node.quote.cut && <p className="text-xs text-muted-foreground">{t.fullText}</p>}
              {node.quote.translation && (
                <p className="mt-2 text-sm leading-relaxed" lang="ru">
                  <span className="text-muted-foreground">{t.translation}: </span>
                  {node.quote.translation}
                </p>
              )}
            </>
          )}
        </div>
      )}
      {node.verdict && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={node.verdict === "supports" ? "secondary" : "outline"}>{t.verdicts[node.verdict]}</Badge>
          {node.checkNote && (
            <span className="text-sm break-words text-muted-foreground" dir="auto">
              {node.checkNote}
            </span>
          )}
        </div>
      )}
      {moderate && node.address && <CheckForm debateId={debateId} moveId={node.id} verdict={node.verdict} />}
      {node.children.length > 0 && (
        <ol className="mt-3 space-y-3 ps-3 sm:ps-5">
          {node.children.map((child) => (
            <Move key={child.id} node={child} debateId={debateId} moderate={moderate} />
          ))}
        </ol>
      )}
    </li>
  );
}

export function DebateTree({ moves, debateId, moderate }: { moves: MoveRow[]; debateId: number; moderate: boolean }) {
  const tree = treeOf(moves);
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{t.tree}</h2>
      {tree.length === 0 ? (
        <p className="mt-2 text-muted-foreground">{t.noMoves}</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {tree.map((node) => (
            <Move key={node.id} node={node} debateId={debateId} moderate={moderate} />
          ))}
        </ol>
      )}
    </section>
  );
}

export function parentOptions(moves: MoveRow[]) {
  const walk = (nodes: TreeNode<MoveRow>[], depth: number): { id: number; depth: number; label: string }[] =>
    nodes.flatMap((node) => [
      { id: node.id, depth, label: `${t.kinds[node.kind]} · ${node.author} · ${node.body.slice(0, 80)}` },
      ...walk(node.children, depth + 1),
    ]);
  return walk(treeOf(moves), 0);
}
