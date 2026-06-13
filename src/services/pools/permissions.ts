import type { PoolMemberRole, Role } from "@prisma/client";

export function canCreatePool(role: Role | undefined) {
  return role === "ADMIN" || role === "ORGANIZER";
}

export function canManagePool(
  appRole: Role | undefined,
  memberRole: PoolMemberRole | undefined
) {
  return appRole === "ADMIN" || memberRole === "OWNER" || memberRole === "ADMIN";
}

export function canDeletePool(
  appRole: Role | undefined,
  memberRole: PoolMemberRole | undefined
) {
  return appRole === "ADMIN" || memberRole === "OWNER";
}
