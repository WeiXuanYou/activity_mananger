/**
 * Birthday helpers. Tiny module — most of the work piggybacks on the
 * existing reminder cron path, but the query helpers are useful on
 * profile pages and the "upcoming birthdays" feed widget.
 */
export type UpcomingBirthday = {
  userId: string;
  name: string;
  avatarColor: string;
  initial: string;
  /** "今天" / "明天" / "5 天後" */
  daysAway: number;
  /** "06/02" — for display */
  dateLabel: string;
  /** Person's age on the upcoming birthday. */
  turningAge: number;
};
