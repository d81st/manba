// Public entry of the glossary module: types, rules and components that any
// page may use. Database reads and writes are in "@/modules/glossary/server".
export { GLOSSARY_TAG, RELATION_KINDS } from "./term.constants";
export { checkTermInput, termSchema, type TermInput } from "./term.validation";
export type {
  PublicDefinition,
  PublicTerm,
  RefAyah,
  RelationKind,
  SaveResult,
  TermForEdit,
  TermSummary,
} from "./term.types";

export { GlossaryList } from "./components/glossary-list";
export { TermForm } from "./components/term-form/term-form";
export { TermArticle } from "./components/term-page/term-article";
