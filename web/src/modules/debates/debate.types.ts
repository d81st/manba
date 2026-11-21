// Shapes returned by the debate queries. No database here.
export const DEBATE_STATUSES = ["proposed", "open", "closed", "published", "declined", "withdrawn"] as const;
export type DebateStatus = (typeof DEBATE_STATUSES)[number];

export const MOVE_KINDS = ["question", "answer", "counter"] as const;
export type MoveKind = (typeof MOVE_KINDS)[number];

export const VERDICTS = ["supports", "does_not_support", "out_of_context"] as const;
export type Verdict = (typeof VERDICTS)[number];

export type Mention = { id: number; question: string };

export type DebateListItem = {
  id: number;
  question: string;
  language: "ru" | "en";
  status: DebateStatus;
  createdBy: string;
  partner: string;
  createdAt: string;
};

export type DebateQuote = {
  text: string;
  cut: boolean;
  title: string;
  sunni: number | null;
  shia: number | null;
  translation: string | null;
};

export type MoveRow = {
  id: number;
  parentId: number | null;
  kind: MoveKind;
  body: string;
  address: string | null;
  author: string;
  createdAt: string;
  verdict: Verdict | null;
  checkNote: string;
  quote: DebateQuote | null;
};

export type DebateDetail = {
  id: number;
  question: string;
  language: "ru" | "en";
  status: DebateStatus;
  createdBy: string;
  partner: string;
  topicSlug: string | null;
  pendingQuestion: string | null;
  pendingQuestionBy: string | null;
  closeRequestedBy: string | null;
  editorNote: string;
  publishedBy: string | null;
  createdAt: string;
  moves: MoveRow[];
};

export type DebateQueueItem = DebateListItem & { cited: number; checked: number };
