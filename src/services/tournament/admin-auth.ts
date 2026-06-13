import type { Role } from "@prisma/client";

export function canManageOfficialResults(role: Role | undefined) {
  return role === "ADMIN";
}
