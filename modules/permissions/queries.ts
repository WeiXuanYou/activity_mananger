import { permissionRequests } from "./data";
import type { PermissionRequest } from "./types";

export const listPermissionRequests = (): PermissionRequest[] => permissionRequests;
export const listPendingRequests = (): PermissionRequest[] =>
  permissionRequests.filter((r) => r.status === "PENDING");
export const listDecidedRequests = (): PermissionRequest[] =>
  permissionRequests.filter((r) => r.status !== "PENDING");
export const listRequestsByUser = (userId: string): PermissionRequest[] =>
  permissionRequests.filter((r) => r.userId === userId);
