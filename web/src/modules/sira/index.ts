// Public entry of the sira module («Жизнеописание пророка»): events, places,
// people and their dates as quoted words of the sources. Database access is in "@/modules/sira/server".
export { SIRA_TAG } from "./sira.constants";
export * from "./sira.dates";
export * from "./sira.graph";
export * from "./sira.periods";
export type * from "./sira.types";
export * from "./sira.validation";

export { EventForm } from "./components/event-form";
export { PeopleGraph } from "./components/people-graph";
export { PersonForm } from "./components/person-form";
export { PlaceCard } from "./components/place-card";
export { PlaceForm } from "./components/place-form";
export { Chart as SiraTimelineChart, Legend as SiraTimelineLegend } from "./components/sira-timeline-chart";
export * from "./components/sira-sources";
