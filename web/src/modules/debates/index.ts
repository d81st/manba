// Public entry of the debates module. Database access is in "@/modules/debates/server".
export type { DebateDetail, DebateListItem, Mention, MoveRow } from "./debate.types";
export { canSee, isParticipant, placeHref } from "./debate.rules";
export { checkMove, checkProposal, positiveId } from "./debate.validation";

export { DebateMentions } from "./components/debate-mentions";
export { ProposeForm } from "./components/propose-form";
