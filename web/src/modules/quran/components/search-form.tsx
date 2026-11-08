import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages } from "@/i18n";
import { MAX_QUERY_LENGTH } from "@/lib/quran-query";

const t = getMessages().quran.search;

export function SearchForm({ query = "" }: { query?: string }) {
  return (
    <form action="/quran/search" className="mt-5 mb-1.5 flex gap-2" role="search">
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
