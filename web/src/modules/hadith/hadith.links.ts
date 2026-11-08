// Marks of the moderator on «похожие тексты» (links between similar hadiths).

export const VERDICTS = ["same", "different", "cleared"] as const;

export type Verdict = (typeof VERDICTS)[number];

export const REVIEW_STATUSES = ["unchecked", "same", "different", "all"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_PAGE_SIZE = 20;

export type PairSide = { address: string; label: string; href: string; text: string };

export type ReviewPair = {
  id: number;
  share: number;
  status: Exclude<ReviewStatus, "all">;
  note: string;
  actor: string | null;
  reviewedAt: string | null;
  first: PairSide;
  second: PairSide;
};

export type ReviewList = {
  counts: Record<ReviewStatus, number>;
  total: number; // pairs with the chosen status
  page: number;
  pages: number;
  pairs: ReviewPair[];
};

export type ReviewFilter = {
  status: ReviewStatus;
  work: string | null; // one side in this collection
  address: string | null; // one side at or under this address
  order: "asc" | "desc"; // by share
  page: number;
};
