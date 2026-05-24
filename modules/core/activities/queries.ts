import { activities } from "./data";
import type { Activity } from "./types";

export const listActivities = (): Activity[] => activities;

export const findActivity = (id: string): Activity | undefined =>
  activities.find((a) => a.id === id);

export const filterActivitiesByCategory = (categoryId: string): Activity[] =>
  activities.filter((a) => a.categoryIds.includes(categoryId));
