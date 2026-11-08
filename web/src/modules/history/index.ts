// Public entry of the history module («Историческая линия»): events on layers,
// each date the quoted words of a source. Database reads and writes are in "@/modules/history/server".
export { ceLabel, ceYears, placeYear } from "./history.calendar";
export { HISTORY_TAG } from "./history.constants";
export { groupByPeriod, SCALES, type Scale } from "./history.periods";
export type { HistoryDate, HistoryEvent, HistoryEventForEdit } from "./history.types";
export { checkHistoryEventInput, HISTORY_LAYERS, HISTORY_STATUSES, historyEventSchema } from "./history.validation";
export type { CheckedHistoryEvent, HistoryDateInput, HistoryEventInput, HistoryLayer } from "./history.validation";

export { HistoryEventForm } from "./components/event-form";
export { HistoryTimeline } from "./components/history-timeline";
