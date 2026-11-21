import { activeLocale } from "./active-locale";
import { en } from "./en";
import type { Locale } from "./locale";
import { ru, type Messages } from "./ru";

export type { Messages };
export { activeLocale } from "./active-locale";
export { defaultLocale, locales, type Locale } from "./locale";

// Interface languages are separate from source-text languages.
const dictionaries: Record<Locale, Messages> = { ru, en };

export function messagesFor(locale: Locale): Messages {
  return dictionaries[locale];
}

// A page keeps `const t = getMessages().quran` next to the component. The
// value is a view onto the dictionary of the request, so the strings are read
// when the page renders, not when the module is first loaded.
export function getMessages(): Messages {
  return view([]) as Messages;
}

function dictionary(): Messages {
  return dictionaries[activeLocale()];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function read(path: readonly string[]): unknown {
  let node: unknown = dictionary();
  for (const key of path) {
    if (!isRecord(node)) return undefined;
    node = node[key];
  }
  return node;
}

function view(path: readonly string[]): object {
  return new Proxy(
    {},
    {
      getPrototypeOf() {
        return Object.prototype;
      },
      get(_target, prop) {
        if (prop === Symbol.toStringTag) return "Object";
        // A message object is not a promise.
        if (prop === "then") return undefined;
        if (typeof prop !== "string" && typeof prop !== "number") return undefined;
        const key = String(prop);
        const value = read([...path, key]);
        if (Array.isArray(value)) return value.slice();
        if (isRecord(value)) return view([...path, key]);
        return value;
      },
      ownKeys() {
        const value = read(path);
        return isRecord(value) ? Reflect.ownKeys(value) : [];
      },
      getOwnPropertyDescriptor(_target, prop) {
        if (typeof prop !== "string") return undefined;
        const parent = read(path);
        if (!isRecord(parent) || !Object.prototype.hasOwnProperty.call(parent, prop)) return undefined;
        const value = parent[prop];
        const shown = Array.isArray(value) ? value.slice() : isRecord(value) ? view([...path, prop]) : value;
        return { configurable: true, enumerable: true, value: shown };
      },
      has(_target, prop) {
        const value = read(path);
        return typeof prop === "string" && isRecord(value) && prop in value;
      },
    },
  );
}

// "5 аятов" / "5 ayahs": the form follows the language of the interface.
export function plural(
  count: number,
  forms: { one: string; few: string; many: string },
  locale: Locale = activeLocale(),
) {
  const rule = new Intl.PluralRules(locale).select(count);
  const form = rule === "one" ? forms.one : rule === "few" ? forms.few : forms.many;
  return `${count} ${form}`;
}
