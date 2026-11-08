// «Новые находки» (migration 025): validation of the finding form. No database
// here, so everything is unit-tested; that the found address exists is
// checked on saving (lib/findings.ts).
import { z } from "zod";
import { parseRefs } from "@/lib/refs";
import type { InputProblem } from "@/lib/input";

export const FINDING_STATUSES = ["new", "checking", "confirmed", "not_found"] as const;

const trimmed = (max: number) => z.string().trim().max(max);

export const findingSchema = z.object({
  status: z.enum(FINDING_STATUSES),
  leadUrl: z.union([trimmed(500).regex(/^https?:\/\/\S+$/, "leadUrl"), z.literal("")]).default(""),
  leadDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "leadDate"), z.literal("")]).default(""),
  claimedSource: trimmed(300).min(1, "claimedSource"),
  claimedText: trimmed(5000).default(""),
  found: trimmed(100).default(""), // "Бухари 1234": where the text really is
  searched: trimmed(3000).default(""),
  note: trimmed(3000).default(""),
  public: z.boolean().default(false),
  reason: trimmed(500).default(""),
});

export type FindingInput = z.infer<typeof findingSchema>;
export type CheckedFinding = FindingInput & { foundAddress: string | null };

// A confirmed finding says where the text is; a public one is a checked
// "not found" with the words and where they were looked for.
export function checkFindingInput(raw: unknown): { input?: CheckedFinding; problems: InputProblem[] } {
  const result = findingSchema.safeParse(raw);
  if (!result.success) {
    return {
      problems: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
      })),
    };
  }
  const input = result.data;
  const problems: InputProblem[] = [];
  let foundAddress: string | null = null;
  if (input.found) {
    const { addresses, invalid } = parseRefs(input.found);
    if (invalid.length || addresses.length !== 1) problems.push({ field: "found", code: "found", detail: input.found });
    else foundAddress = addresses[0];
  }
  if (input.status === "confirmed" && !input.found) problems.push({ field: "found", code: "foundRequired" });
  if (input.status === "not_found" && !input.searched) problems.push({ field: "searched", code: "searchedRequired" });
  if (input.public && input.status !== "not_found") problems.push({ field: "public", code: "publicNotFound" });
  if (input.public && !input.claimedText) problems.push({ field: "claimedText", code: "claimedTextRequired" });
  return problems.length ? { problems } : { input: { ...input, foundAddress }, problems };
}

// "https://www.youtube.com/watch?v=…" -> "youtube.com": the public page names
// where a lead came from without linking to it.
export function leadHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
