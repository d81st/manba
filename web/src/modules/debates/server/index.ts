// Server side of the debates module. Import from "@/modules/debates/server".
import "server-only";

export { debateExport, debatesForAddresses, getDebate, listDebateQueue, listDebates } from "./debate.queries";
export {
  acceptDebateAction,
  acceptQuestionAction,
  adminCloseAction,
  adminReopenAction,
  cancelQuestionAction,
  checkMoveAction,
  declineDebateAction,
  editQuestionAction,
  postMoveAction,
  proposeDebateAction,
  proposeQuestionAction,
  publishDebateAction,
  rejectQuestionAction,
  requestCloseAction,
  withdrawDebateAction,
} from "./debate.actions";
export { DebateView } from "../components/debate-view";
