import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages } from "@/i18n";
import { MAX_QUERY_LENGTH } from "@/lib/quran-query";

const t = getMessages().hadith.search;

// On a collection's page a bare number ("8") is read in that collection.
export function HadithSearchForm({ query = "", work }: { query?: string; work?: string }) {
  return (
    <form action="/hadith/search" className="mt-5 mb-1.5 flex gap-2" role="search">
      {work && <input type="hidden" name="work" value={work} />}
      <label htmlFor="q" className="sr-only">
        {t.label}
      </label>
      <Input
        id="q"
        name="q"
        type="search"
        dir="auto"
        defaultValue={query}
        placeholder={t.placeholder}
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        className="h-10 text-base"
      />
      <Button type="submit" size="lg">
        <Search />
        {t.submit}
      </Button>
    </form>
  );
}
