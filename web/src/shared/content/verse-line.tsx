import { Fragment } from "react";

// A paragraph of an OpenITI text: "%~%" separates the two halves of a line of
// poetry; it is shown as a gap, as in print, and the stored text is not changed.
export function VerseLine({ text }: { text: string }) {
  const halves = text.split(/\s*%~%\s*/);
  if (halves.length === 1) return text;
  return halves.map((half, i) => (
    <Fragment key={i}>
      {i > 0 && <span className="inline-block w-8" aria-hidden />}
      {i > 0 && " "}
      {half}
    </Fragment>
  ));
}
