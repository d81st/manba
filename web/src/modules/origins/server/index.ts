// Server side of the origins module («Истоки и связи»). Import from "@/modules/origins/server".
import "server-only";

export { getParallelForEdit, listParallels, listParallelsForAdmin } from "./parallel.queries";
export { getParallel } from "./parallel-page.queries";
export { saveParallel } from "./parallel.commands";
