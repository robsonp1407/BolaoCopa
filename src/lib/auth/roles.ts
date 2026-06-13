import type { Role } from "@prisma/client";

const roleHierarchy: Record<Role, number> = {
  PARTICIPANT: 1,
  ORGANIZER: 2,
  ADMIN: 3
};

export function hasRole(userRole: Role | undefined, requiredRole: Role) {
  if (!userRole) {
    return false;
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function isAdmin(userRole: Role | undefined) {
  return userRole === "ADMIN";
}

export function isOrganizerOrAdmin(userRole: Role | undefined) {
  return hasRole(userRole, "ORGANIZER");
}
