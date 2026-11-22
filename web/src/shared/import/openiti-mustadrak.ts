// The Shamela export of al-Hakim's «al-Mustadrak» (ed. Mustafa Abd al-Qadir
// Ata) in OpenITI prints after a report the remark of al-Dhahabi from his
// «Talkhis» as a heading of its own and a line numbered like the report:
//
//   ### | [التعليق - من تلخيص الذهبي]
//   # 4 - صحيح ولا علة له
//
// and, where a report is given in two chains with a sub-heading between them,
// repeats the report's number ("### | 264 -", "### | وأما حديث مسعر",
// "### | 264 -"). This rewrites the file for parseOpenitiNumbered without
// touching the words: the remark becomes a paragraph of the report it stands
// after, opened by the editor's own label and keeping its own number (a
// remark may cover the report before as well: "27" followed by "# 26 - ..."),
// so that al-Dhahabi's words stay marked as his; a
// repeated number and the sub-headings before it become paragraphs of the
// same report. Nothing is renumbered; numbers the export lacks stay missing.

export const TALKHIS_LABEL = "[التعليق - من تلخيص الذهبي]";

export type MustadrakReport = {
  remarks: number; // al-Dhahabi's remarks folded into their reports
  mismatched: string[]; // remarks whose number differs from the report before them
  repeated: number[]; // report numbers given twice, folded into one report
};

const REPORT = /^### \| (\d+)(?: ms\d+)? - /;
const REMARK_LINE = /^# (\d+)(?: ms\d+)? -/;
// Milestones ("ms0005") may stand anywhere in the label line.
const withoutMilestones = (line: string) => line.replace(/\s*\bms\d+\b/g, "").trim();

export function mustadrakToNumbered(source: string): { text: string; report: MustadrakReport } {
  const lines = source.split("\n");
  const out: string[] = [];
  const report: MustadrakReport = { remarks: 0, mismatched: [], repeated: [] };
  let current = 0; // the report being read
  let pending: string[] = []; // sub-headings after a report, until we know what follows
  const flush = () => {
    out.push(...pending);
    pending = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const report_ = line.match(REPORT);
    if (report_) {
      const n = Number(report_[1]);
      if (n === current) {
        // The same report again: the sub-headings and this marker become text.
        report.repeated.push(n);
        out.push(...pending.map((h) => (h.startsWith("### ") ? `# ${h.replace(/^### \|+\s*/, "")}` : h)));
        pending = [];
        const rest = line.replace(REPORT, "").trim();
        if (rest) out.push(`# ${rest}`);
        continue;
      }
      flush();
      current = n;
      out.push(line);
      continue;
    }
    if (withoutMilestones(line) === `### | ${TALKHIS_LABEL}`) {
      const next = lines[i + 1] ?? "";
      const m = next.match(REMARK_LINE);
      if (m) {
        flush();
        report.remarks += 1;
        if (Number(m[1]) !== current) report.mismatched.push(`${current}/${m[1]}`);
        out.push(`# ${TALKHIS_LABEL} ${next.slice(2)}`);
        i += 1;
        continue;
      }
    }
    if (current > 0 && /^### \|(?!\|)/.test(line) && !/^### \| كتاب/.test(line)) {
      // A heading after a report: kept as it is unless the report repeats.
      flush();
      pending.push(line);
      continue;
    }
    if (pending.length && !/^# PageV\d+P\d+\s*$/.test(line)) flush();
    if (pending.length) {
      pending.push(line);
      continue;
    }
    out.push(line);
  }
  flush();
  return { text: out.join("\n"), report };
}
