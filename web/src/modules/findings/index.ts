// Public entry of the findings module: «Новые находки» (leads from outside,
// checked against the sources) and «Не найдено в источниках».
export { FINDINGS_TAG } from "./finding.constants";
export { foundLabel } from "./finding.labels";
export type { Finding } from "./finding.types";
export { checkFindingInput, FINDING_STATUSES, findingSchema, leadHost } from "./finding.validation";
export type { CheckedFinding, FindingInput } from "./finding.validation";

export { FindingForm } from "./components/finding-form";
export { NotFoundList } from "./components/not-found-list";
