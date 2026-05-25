/**
 * Public API barrel for the feed module.
 *
 * The feed is a **composition** module under `core/` — it joins outputs
 * from activities + posts + polls into a single typed union, and exports
 * the React components that render the resulting timeline.
 *
 * Pages import from this barrel only — never reach into internals.
 *
 * Naming convention: the discriminated-union TYPE is re-exported as
 * `FeedItemData` to avoid clashing with the `FeedItem` COMPONENT that
 * renders one entry. Inside the module the type is just `FeedItem`.
 */
export type { FeedItem as FeedItemData, FeedBuildOptions } from "./types";
export { buildFeed } from "./queries";
export { FeedHero } from "./components/FeedHero";
export { FeedItem } from "./components/FeedItem";
export { PinnedSection } from "./components/PinnedSection";
