export type PollOption = {
  id: string;
  label: string;
  votes: number;
  addedById?: string;
};

export type PollStatus = "OPEN" | "CLOSING_SOON" | "CLOSED";

export type Poll = {
  id: string;
  question: string;
  authorId: string;
  options: PollOption[];
  totalVotes: number;
  closesAt: string;       // ISO date
  closesIn: string;        // human-readable countdown
  multiSelect: boolean;
  anonymous: boolean;
  allowAddOption: boolean;
  status: PollStatus;
  categoryIds: string[];
};

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};
