import type { PoolMemberRole, PrismaClient, Role } from "@prisma/client";

import { createAuditLog } from "@/services/tournament/audit";

import { PoolServiceError } from "./errors";
import { canManagePool } from "./permissions";

export async function removePoolMember(
  prisma: PrismaClient,
  input: {
    poolId: string;
    targetUserId: string;
    actorUserId: string;
    actorRole: Role;
  }
) {
  return prisma.$transaction(async (tx) => {
    const actorMember = await tx.poolMember.findUnique({
      where: {
        poolId_userId: {
          poolId: input.poolId,
          userId: input.actorUserId
        }
      },
      select: { role: true }
    });

    if (!canManagePool(input.actorRole, actorMember?.role)) {
      throw new PoolServiceError("Acesso negado", 403, "POOL_FORBIDDEN");
    }

    const targetMember = await tx.poolMember.findUnique({
      where: {
        poolId_userId: {
          poolId: input.poolId,
          userId: input.targetUserId
        }
      }
    });

    if (!targetMember) {
      throw new PoolServiceError("Membro nao encontrado", 404, "MEMBER_NOT_FOUND");
    }

    if (targetMember.role === "OWNER") {
      throw new PoolServiceError(
        "OWNER nao pode ser removido sem transferir propriedade",
        409,
        "OWNER_CANNOT_BE_REMOVED"
      );
    }

    await tx.poolMember.delete({ where: { id: targetMember.id } });

    await createAuditLog(tx, {
      action: "POOL_MEMBER_REMOVED",
      entity: "Pool",
      entityId: input.poolId,
      userId: input.actorUserId,
      metadata: {
        removedUserId: input.targetUserId,
        removedRole: targetMember.role
      }
    });

    return { ok: true };
  });
}

export type PoolMemberRoleForRemoval = PoolMemberRole;
