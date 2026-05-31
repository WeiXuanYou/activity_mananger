import type { Member } from "@/modules/core/members";

/**
 * Lodging — recommendations & past-stay history keyed by region.
 *
 * Two flavours flow through the same shape:
 *  - Recommendation: `stayedAt` is null. Someone added it because it
 *    looked good for the area.
 *  - Past stay:      `stayedAt` is set and (usually) `activityId` points
 *    at the trip it was used during.
 *
 * `region` is the discovery key — substring matching against an
 * activity's `location` is how we surface relevant lodging when
 * planning a new trip in the same area.
 */
export type Lodging = {
  id: string;
  name: string;
  region: string;
  address?: string | null;
  notes?: string | null;
  pricePerNightCents?: number | null;
  currency: string;
  url?: string | null;
  rating?: number | null;
  addedById: string;
  addedBy?: Member;
  /** When true, any member can edit this entry (creator opt-in). Delete
   *  stays owner-or-admin. */
  allowCollab?: boolean;
  stayedAt?: string | null;
  activityId?: string | null;
  activityTitle?: string | null;
  createdAt: string;
};
