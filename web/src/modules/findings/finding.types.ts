
export type Finding = {
  id: number;
  status: string;
  leadUrl: string;
  leadDate: string;
  claimedSource: string;
  claimedText: string;
  foundAddress: string | null;
  searched: string;
  note: string;
  public: boolean;
  updatedAt: string;
};
