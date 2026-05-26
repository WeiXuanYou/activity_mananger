/**
 * Phase C — DB-backed queries for permission requests.
 */
import { db } from "@/lib/db";
import type { Role } from "@/modules/auth";
import type { PermissionRequest, PermissionRequestStatus } from "./types";

type RequestRow = {
  id: string;
  userId: string;
  reason: string;
  status: string;
  decidedById: string | null;
  createdAt: Date;
  currentRole: { name: string };
  requestedRole: { name: string };
};

function relativeTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨天";
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString("zh-TW");
}

export function prismaRequestToRequest(row: RequestRow): PermissionRequest {
  return {
    id: row.id,
    userId: row.userId,
    currentRole: row.currentRole.name as Role,
    requestedRole: row.requestedRole.name as Role,
    reason: row.reason,
    status: row.status as PermissionRequestStatus,
    createdAt: relativeTime(row.createdAt),
    decidedById: row.decidedById ?? undefined,
  };
}

const REQUEST_INCLUDE = {
  currentRole: { select: { name: true } },
  requestedRole: { select: { name: true } },
} as const;

export async function listPendingRequestsDb(): Promise<PermissionRequest[]> {
  const rows = await db.permissionRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: REQUEST_INCLUDE,
  });
  return rows.map(prismaRequestToRequest);
}

export async function listDecidedRequestsDb(): Promise<PermissionRequest[]> {
  const rows = await db.permissionRequest.findMany({
    where: { status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    include: REQUEST_INCLUDE,
  });
  return rows.map(prismaRequestToRequest);
}

export async function listRequestsByUserDb(userId: string): Promise<PermissionRequest[]> {
  const rows = await db.permissionRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: REQUEST_INCLUDE,
  });
  return rows.map(prismaRequestToRequest);
}
