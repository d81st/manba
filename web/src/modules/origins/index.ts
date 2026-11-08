// Public entry of the origins module («Истоки и связи»): links between texts of
// Islam and of other religions, with both readings. Database access is in "@/modules/origins/server".
export { PARALLELS_TAG } from "./parallel.constants";
export { formatAnyRefs, isOutside } from "./parallel.refs";
export type { ParallelForEdit, ParallelSummary, PublicParallel, RefItem } from "./parallel.types";
export * from "./parallel.validation";

export { ParallelArticle } from "./components/parallel-article";
export { ParallelForm } from "./components/parallel-form";
export { RefItems } from "./components/ref-items";
