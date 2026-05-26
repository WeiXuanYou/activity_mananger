export type { Poll, PollOption, PollStatus, Comment } from "./types";

// Phase A — sync mock helpers
export { polls, sampleComments } from "./data";
export { listPolls, findPoll, filterPollsByCategory } from "./queries";

// Phase C — async DB helpers
export {
  prismaPollToPoll,
  listPollsDb,
  findPollDb,
  findMyVotesDb,
  listVotersByOptionDb,
} from "./db";

// UI
export { PollCard } from "./components/PollCard";
