import { defaultLocale, isLocale, type Locale } from "./locale";

// The server installs a reader (locale-reader.server.ts) that looks at the
// request cookie. The browser reads the language of the document, which the
// root layout set from that same cookie.
type Reader = () => Locale;

const KEY = "__manbaLocaleReader";

export function installLocaleReader(read: Reader) {
  (globalThis as typeof globalThis & { [KEY]?: Reader })[KEY] = read;
}

export function activeLocale(): Locale {
  if (typeof window !== "undefined") {
    const marked = document.querySelector("[data-locale]")?.getAttribute("data-locale");
    if (isLocale(marked)) return marked;
    return isLocale(document.documentElement.lang) ? document.documentElement.lang : defaultLocale;
  }
  const read = (globalThis as typeof globalThis & { [KEY]?: Reader })[KEY];
  if (!read) return defaultLocale;
  try {
    return read();
  } catch {
    return defaultLocale;
  }
}
