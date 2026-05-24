import type { Role } from "@/modules/auth";

export type Member = {
  id: string;
  name: string;
  handle: string;
  role: Role;
  avatarColor: string;
  initial: string;
};
