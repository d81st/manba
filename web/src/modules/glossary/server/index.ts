// Server side of the glossary module: database reads and writes. Import from
// "@/modules/glossary/server" in server components and other modules' server code.
import "server-only";

export { getTermForEdit, listPublishedTerms, listTermChoices, listTermsForAdmin } from "./term.queries";
export { getPublishedTerm } from "./term-page.queries";
export { deleteDraftTerm, saveTerm } from "./term.commands";
export { listTermLinks } from "./term-links.queries";
