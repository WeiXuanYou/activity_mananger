import type { Member } from "@/modules/core/members";
import type { Category } from "@/modules/core/categories";

/**
 * Activity — UI shape used by both mock and DB sources.
 *
 * `host` and `categories` are OPTIONAL pre-resolved fields: DB sources
 * populate them via adapter; mock sources leave undefined and UI falls
 * back to sync lookups.
 */
export type Activity = {
  id: string;
  title: string;
  hostId: string;
  host?: Member;
  startsAt: string;
  location: string;
  cover: string;
  rsvp: { going: number; maybe: number; declined: number };
  description: string;
  categoryIds: string[];
  categories?: Category[];
};
