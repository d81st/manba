import "server-only";
import { analyzeQuestion } from "../assistant.analysis";
import type { AssistantResult } from "../assistant.types";
import { concepts } from "./concepts.queries";
import { edges, pages } from "./pages.queries";
import { sources } from "./sources.queries";

// «Ассистент по источникам», first phase (docs/PLAN.md, migration 024): the
// words of a question, widened by the glossary and the synonyms, are searched
// in the sources and the encyclopedia; results are ordered by the authority of
// the source, then by how many words of the question they match. The
// assistant writes no text: every result is a fragment or a page of the site.
export async function ask(question: string): Promise<AssistantResult> {
  const analysis = analyzeQuestion(question);
  const { concepts: list, terms } = await concepts(analysis);
  const [{ quran, hadith }, pageHits] = await Promise.all([sources(list, analysis.refs), pages(list, terms)]);
  const graphEdges = await edges(pageHits, [...quran, ...hadith].map((s) => s.address));
  return { analysis, concepts: list, quran, hadith, pages: pageHits, edges: graphEdges };
}
