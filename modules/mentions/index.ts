export { MENTION_RE, extractMentions, splitMentions } from "./parse";
export type { MentionSegment } from "./parse";
export { MentionText } from "./components/MentionText";
// notifyMentions is server-only — import directly from "./notify".
