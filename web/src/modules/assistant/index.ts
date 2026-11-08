// Public entry of the assistant module («Ассистент по источникам», first phase):
// finds fragments and pages for a question and writes no text of its own.
// Database access is in "@/modules/assistant/server".
export * from "./assistant.analysis";
export type * from "./assistant.types";

export { Answer } from "./components/answer";
export { AnswerGraph } from "./components/answer-graph";
export { AskForm, Examples } from "./components/ask-form";
