export type Report = {
  id: number;
  status: string;
  page: string;
  quote: string;
  message: string;
  createdBy: string;
  createdAt: string; // "10.11.2026 14:05"
  doneBy: string | null;
};
