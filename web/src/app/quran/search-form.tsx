import { getMessages } from "@/i18n";
import { MAX_QUERY_LENGTH } from "@/lib/quran-query";
import styles from "./quran.module.css";

const t = getMessages().quran.search;

export function SearchForm({ query = "" }: { query?: string }) {
  return (
    <form action="/quran/search" className={styles.searchForm} role="search">
      <label htmlFor="q" className="sr-only">
        {t.label}
      </label>
      <input
        id="q"
        name="q"
        type="search"
        dir="auto"
        defaultValue={query}
        placeholder={t.placeholder}
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
      />
      <button className="button" type="submit">
        {t.submit}
      </button>
    </form>
  );
}
