import type { Messages } from "@/i18n";
import type { TermInput } from "../../term.validation";

// What every card of the term form receives from the form itself.
export type AdminStrings = Messages["admin"];
export type Definition = TermInput["definitions"][number] & { key: number };
export type Relation = TermInput["related"][number];
// The error text of a field, if the last save found a problem there.
export type ErrorOf = (field: string) => string | undefined;
export type SetField = <K extends keyof TermInput>(key: K, value: TermInput[K]) => void;
