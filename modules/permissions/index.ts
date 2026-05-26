export type { PermissionKey, PermissionRequest, PermissionRequestStatus } from "./types";

// Matrix + labels (single source of truth)
export {
  ROLE_PERMISSIONS,
  ROLE_LABEL,
  ROLE_DESCRIPTIONS,
  permissionRequests,
} from "./data";

// Phase A — sync mock queries (used by /mockup/*)
export {
  listPermissionRequests,
  listPendingRequests,
  listDecidedRequests,
  listRequestsByUser,
} from "./queries";

// Phase C — async DB queries
export {
  prismaRequestToRequest,
  listPendingRequestsDb,
  listDecidedRequestsDb,
  listRequestsByUserDb,
} from "./db";

// The guard — used in every protected action
export {
  requirePermission,
  roleHas,
  canCurrentUser,
  PermissionDeniedError,
} from "./guard";

export { RoleBadge } from "./components/RoleBadge";
