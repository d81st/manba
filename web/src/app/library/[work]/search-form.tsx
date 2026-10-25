import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages } from "@/i18n";
import { MAX_QUERY_LENGTH } from "@/lib/quran-query";

const t = getMessages().library.book.search;

// A tafsir is searched by ayah ("2:255"), the Sira by page ("1:235").
export function BookSearchForm({ work, query = "", tafsir = false }: { work: string; query?: string; tafsir?: boolean }) {
  return (
    <form action={`/library/${work}/search`} className="mt-5 mb-1.5 flex gap-2" role="search">
      <label htmlFor="q" className="sr-only">
        {t.label}
      </label>
      <Input
        id="q"
        name="q"
        type="search"
        dir="auto"
        defaultValue={query}
        placeholder={tafsir ? t.placeholderTafsir : t.placeholder}
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
