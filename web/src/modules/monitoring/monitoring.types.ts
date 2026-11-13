// One row of the journal of site errors (migration 059), as it is saved.
export type ErrorEntry = {
  kind: "server" | "client";
  route: string;
  path: string;
  method: string;
  digest: string;
  message: string;
  stack: string;
};

// Errors with the same place and message, for the panel.
export type ErrorGroup = {
  kind: ErrorEntry["kind"];
  route: string;
  message: string;
  count: number;
  first: string; // DD.MM.YYYY HH24:MI, UTC
  last: string;
  path: string; // of the last one
  digest: string;
  stack: string;
};
