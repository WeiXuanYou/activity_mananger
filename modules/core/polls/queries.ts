import { polls } from "./data";
import type { Poll } from "./types";

export const listPolls = (): Poll[] => polls;
export const findPoll = (id: string): Poll | undefined => polls.find((p) => p.id === id);
export const filterPollsByCategory = (categoryId: string): Poll[] =>
  polls.filter((p) => p.categoryIds.includes(categoryId));
