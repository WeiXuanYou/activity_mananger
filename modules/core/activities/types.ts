export type Activity = {
  id: string;
  title: string;
  hostId: string;
  startsAt: string;
  location: string;
  cover: string;
  rsvp: { going: number; maybe: number; declined: number };
  description: string;
  categoryIds: string[];
};
