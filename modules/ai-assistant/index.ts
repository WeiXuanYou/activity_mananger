// Public API for the AI assistant module. See ./README.md for context.

export type {
  AssistantCapability,
  Suggestion,
  AssistantTurn,
  AssistantContext,
  ClassifySuggestion,
  DraftActivityResult,
} from "./types";

export { callLLM, isLLMConfigured } from "./client";
export type { LLMRequest } from "./client";

export { COMPOSER_SUGGESTIONS, CAPABILITY_MENU } from "./data";

export {
  suggestCategories,
  summarize,
  draftActivity,
  draftPoll,
} from "./queries";

export { AssistantSuggestions } from "./components/AssistantSuggestions";
export { SuggestionCard } from "./components/SuggestionCard";
export { AssistantFab } from "./components/AssistantFab";
