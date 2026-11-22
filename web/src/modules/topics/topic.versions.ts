// The admin form of «Версии рядом»: one point (a neutral question) with a cell
// per position of the topic. Checks that need no database; whether a
// quotation stands in its position and its fragment is checked on saving
// (server/version.commands.ts).
import { z } from "zod";
import { parseRefs } from "@/shared/addresses/refs";
import type { InputProblem } from "@/shared/forms/input";

export const MAX_POINT_LABEL = 200;
export const MAX_CELL_QUOTE = 2000;

const pointSchema = z.object({
  label: z.string().trim().min(1, "label").max(MAX_POINT_LABEL, "label"),
  position: z.coerce.number().int().min(0).max(999),
  cells: z.array(
    z.object({
      holder: z.string().trim().min(1).max(500),
      quote: z.string().trim().max(MAX_CELL_QUOTE, "quote"),
      ref: z.string().trim().max(200),
    }),
  ),
});

// row: the cell's row in the form, so a problem found on saving names the right position.
export type VersionCellInput = { holder: string; quote: string; address: string; row: number };
export type VersionPointInput = { label: string; position: number; cells: VersionCellInput[] };

// A cell with no quotation is left out: the source says nothing on the point.
// A filled cell needs exactly one place, written as elsewhere in the admin
// ("Ибн Хишам 2:245b", "Бухари 4200", "2:255").
export function checkVersionPointInput(raw: unknown): { input?: VersionPointInput; problems: InputProblem[] } {
  const result = pointSchema.safeParse(raw);
  if (!result.success) {
    return {
      problems: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        code: /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid",
      })),
    };
  }
  const problems: InputProblem[] = [];
  const cells: VersionCellInput[] = [];
  const holders = new Set<string>();
  result.data.cells.forEach((cell, i) => {
    if (holders.has(cell.holder)) problems.push({ field: `cells.${i}.holder`, code: "holderTwice" });
    holders.add(cell.holder);
    if (!cell.quote && !cell.ref) return;
    if (!cell.quote) {
      problems.push({ field: `cells.${i}.quote`, code: "quoteMissing" });
      return;
    }
    const { addresses, invalid } = parseRefs(cell.ref);
    if (invalid.length || addresses.length !== 1) {
      problems.push({ field: `cells.${i}.ref`, code: "refOne", detail: cell.ref });
      return;
    }
    cells.push({ holder: cell.holder, quote: cell.quote, address: addresses[0], row: i });
  });
  if (problems.length) return { problems };
  return { input: { label: result.data.label, position: result.data.position, cells }, problems: [] };
}
