/**
 * Shared "should this be visible by default?" rules.
 *
 * Two sources of invisibility:
 *   1. Manual hide — `hiddenAt` is non-null (owner or moderator hid it)
 *   2. Auto-hide  — stale content past a per-type window
 *
 * Lists / feeds / search filter both out by default. Detail pages still
 * render the content if you visit it directly (a link in old chat, an
 * old notification, etc.), but surface a "已隱藏" / "已過期" banner.
 *
 * Thresholds chosen to match casual-Facebook expectations:
 *   - Activities: 90 days after `startsAt`  — three months covers
 *     post-event reminiscing and photo-sharing
 *   - Polls:      30 days after `closesAt` — settled decisions don't
 *     need to stay in the feed
 *   - Posts:      no auto-hide — articles are timeless by intent;
 *     authors can manually hide
 */

const DAY = 24 * 60 * 60 * 1000;

export const ACTIVITY_AUTO_HIDE_DAYS = 90;
export const POLL_AUTO_HIDE_DAYS = 30;

export function activityAutoHideCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - ACTIVITY_AUTO_HIDE_DAYS * DAY);
}

export function pollAutoHideCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - POLL_AUTO_HIDE_DAYS * DAY);
}

/**
 * Prisma `where` fragment that excludes manually-hidden + auto-hidden
 * activities. AND it with any caller-supplied filter.
 *
 * "Auto-hide" = startsAt is older than the cutoff. Activities that
 * haven't started yet (or just started) are always shown regardless
 * of how long ago they were posted.
 */
export function visibleActivitiesWhere() {
  return {
    hiddenAt: null,
    startsAt: { gte: activityAutoHideCutoff() },
  };
}

/**
 * Prisma `where` fragment for polls. Polls without a `closesAt`
 * (open-ended) are always shown unless manually hidden.
 */
export function visiblePollsWhere() {
  const cutoff = pollAutoHideCutoff();
  return {
    hiddenAt: null,
    OR: [{ closesAt: null }, { closesAt: { gte: cutoff } }],
  };
}

/**
 * Prisma `where` fragment for posts — only manual hide. (Posts are
 * timeless by design; authors can flip hiddenAt if they want.)
 */
export function visiblePostsWhere() {
  return { hiddenAt: null };
}
