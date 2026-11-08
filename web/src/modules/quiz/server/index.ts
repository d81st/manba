// Server side of the quiz module («Тесты»). Import from "@/modules/quiz/server".
import "server-only";

export { getQuestionForEdit, getQuizQuestions, listQuestionsForAdmin, listQuizChoices } from "./quiz.queries";
export { saveQuestion } from "./quiz.commands";
