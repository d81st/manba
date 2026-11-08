// Public entry of the quiz module («Тесты»): questions built from fragments of
// the sources. Database reads and writes are in "@/modules/quiz/server".
export { QUIZ_TAG } from "./quiz.constants";
export { levelKey, questionLevel } from "./quiz.levels";
export type { QuizAyah, QuizQuestion } from "./quiz.types";
export { checkQuestionInput, MAX_OPTIONS, QUIZ_STATUSES, questionSchema } from "./quiz.validation";
export type { CheckedQuestion, QuestionInput } from "./quiz.validation";

export { QuestionForm } from "./components/question-form";
export { QuizList } from "./components/quiz-list";
