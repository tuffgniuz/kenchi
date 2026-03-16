export type JournalCommitmentStatus = "unmarked" | "missed" | "partial" | "done";

export type JournalCommitment = {
  id: string;
  text: string;
  status: JournalCommitmentStatus;
  order: number;
};

export type JournalReflection = {
  wentWell: string;
  didntGoWell: string;
  learned: string;
  gratitude: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  morningIntention: string;
  diaryEntry: string;
  reflectionEntry: string;
  focuses: string[];
  commitments: JournalCommitment[];
  reflection: JournalReflection;
  createdAt: string;
  updatedAt: string;
};

export type JournalEntrySummary = {
  date: string;
  preview: string;
};
