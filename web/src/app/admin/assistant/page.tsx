import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { deleteSynonymAction, saveSynonymAction } from "@/modules/assistant/server";
import { listMisses, listSynonyms } from "@/modules/assistant/server";
import type { Synonym } from "@/modules/assistant";

const messages = getMessages();
const t = messages.admin.assistant;

export const metadata: Metadata = { title: t.title };

export default function AdminAssistantPage({ searchParams }: PageProps<"/admin/assistant">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Synonyms searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

function SynonymForm({ synonym }: { synonym?: Synonym }) {
  const key = synonym ? `-${synonym.id}` : "";
  return (
    <form action={saveSynonymAction} className="grid gap-3 sm:grid-cols-[1fr_2fr]">
      {synonym && <input type="hidden" name="id" value={synonym.id} />}
      <div className="space-y-1">
        <Label htmlFor={`phrase${key}`}>{t.phrase}</Label>
        <Input id={`phrase${key}`} name="phrase" defaultValue={synonym?.phrase ?? ""} required />
        <p className="text-xs text-muted-foreground">{t.phraseHint}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`forms${key}`}>{t.forms}</Label>
        <Textarea id={`forms${key}`} name="forms" rows={2} defaultValue={synonym?.forms.join(", ") ?? ""} required />
        <p className="text-xs text-muted-foreground">{t.formsHint}</p>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor={`note${key}`}>{t.note}</Label>
        <Input id={`note${key}`} name="note" defaultValue={synonym?.note ?? ""} />
      </div>
      <div>
        <Button type="submit">{synonym ? t.save : t.add}</Button>
      </div>
    </form>
  );
}

async function Synonyms({ searchParams }: Pick<PageProps<"/admin/assistant">, "searchParams">) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const [synonyms, misses] = await Promise.all([listSynonyms(), listMisses()]);
  const error = typeof params.error === "string" ? (t.errors as Record<string, string>)[params.error] ?? t.errors.invalid : null;
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {params.saved === "1" && !error && (
        <Alert className="mt-4">
          <AlertDescription>{t.saved}</AlertDescription>
        </Alert>
      )}
      <section className="mt-6 rounded-xl border bg-card p-4">
        <SynonymForm />
      </section>
      <section className="mt-6">
        {synonyms.length === 0 ? (
          <p className="text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {synonyms.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer">
                    <span className="font-medium">{s.phrase}</span> →{" "}
                    <span className="ar" dir="auto">
                      {s.forms.join(", ")}
                    </span>
                    {s.note && <span className="text-sm text-muted-foreground"> · {s.note}</span>}
                  </summary>
                  <div className="mt-3 space-y-3">
                    <SynonymForm synonym={s} />
                    <form action={deleteSynonymAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="outline" size="sm">
                        {t.remove}
                      </Button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.misses}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.missesHint}</p>
        {misses.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t.noMisses}</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-start text-muted-foreground">
              <tr>
                <th className="py-1 text-start font-normal">{t.words}</th>
                <th className="py-1 text-end font-normal">{t.count}</th>
                <th className="py-1 text-end font-normal">{t.month}</th>
              </tr>
            </thead>
            <tbody>
              {misses.map((m) => (
                <tr key={m.words} className="border-t">
                  <td className="py-1" dir="auto">
                    {m.words}
                  </td>
                  <td className="py-1 text-end tabular-nums">{m.count}</td>
                  <td className="py-1 text-end tabular-nums">{m.lastMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
