import type { Role } from "@/modules/auth";

export type Member = {
  id: string;
  name: string;
  handle: string;
  role: Role;
  avatarColor: string;
  initial: string;
  /** Optional data-URL avatar. When present the UI uses this image
   *  in place of the initial+color circle. */
  avatarImage?: string | null;
};
