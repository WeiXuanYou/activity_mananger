import { daysFromNow } from "@/lib/date";
import { activities } from "./data";
import type { Activity } from "./types";

export const listActivities = (): Activity[] => activities;

export const findActivity = (id: string): Activity | undefined =>
  activities.find((a) => a.id === id);

export const filterActivitiesByCategory = (categoryId: string): Activity[] =>
  activities.filter((a) => a.categoryIds.includes(categoryId));

/** Activities sorted by start date, future first then past. */
export const listActivitiesByDate = (): Activity[] =>
  [...activities].sort((a, b) => daysFromNow(a.startsAt) - daysFromNow(b.startsAt));

export const listUpcomingActivities = (): Activity[] =>
  listActivitiesByDate().filter((a) => daysFromNow(a.startsAt) >= 0);

export const listPastActivities = (): Activity[] =>
  listActivitiesByDate().filter((a) => daysFromNow(a.startsAt) < 0).reverse();

export const findNextActivity = (): Activity | undefined =>
  listUpcomingActivities()[0];
