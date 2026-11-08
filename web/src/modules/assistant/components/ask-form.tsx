import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { getMessages } from "@/shared/i18n";
import { MAX_QUESTION } from "../assistant.analysis";

const t = getMessages().assistant;

// Questions to start from on an empty page or when nothing was found.
const EXAMPLES = ["что говорится о джизье?", "джихад", "когда убили Усмана", "Ибн Сина", "2:255"];

// The question box; the view (list or graph) is kept when asking again.
export function AskForm({ q, view }: { q: string; view: "list" | "graph" }) {
  return (
    <form action="/assistant" className="mt-4 flex gap-2">
      <Input name="q" defaultValue={q} placeholder={t.placeholder} maxLength={MAX_QUESTION} aria-label={t.title} className="flex-1" />
      {view === "graph" && <input type="hidden" name="view" value="graph" />}
      <Button type="submit">
        <Search />
        {t.submit}
      </Button>
    </form>
  );
}

export function Examples() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t.examples}:</span>
      {EXAMPLES.map((e) => (
        <Link key={e} href={`/assistant?q=${encodeURIComponent(e)}`} className="rounded-full border px-3 py-0.5 no-underline hover:bg-accent">
          {e}
        </Link>
      ))}
    </p>
  );
}
