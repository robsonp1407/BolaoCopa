import type { PrismaClient } from "@prisma/client";

import { createAuditLog } from "@/services/tournament/audit";

import { PoolServiceError } from "./errors";

export async function leavePool(
  prisma: PrismaClient,
  input: { poolId: string; userId: string }
) {
  return prisma.$transaction(async (tx) => {
    const member = await tx.poolMember.findUnique({
      where: {
        poolId_userId: {
          poolId: input.poolId,
          userId: input.userId
        }
      }
    });

    if (!member) {
      throw new PoolServiceError("Usuario nao participa deste bolao", 404, "MEMBER_NOT_FOUND");
    }

    if (member.role === "OWNER") {
      throw new PoolServiceError(
        "OWNER nao pode sair sem transferir propriedade",
        409,
        "OWNER_CANNOT_LEAVE"
      );
    }

    await tx.poolMember.delete({ where: { id: member.id } });

    await createAuditLog(tx, {
      action: "POOL_LEFT",
      entity: "Pool",
      entityId: input.poolId,
      userId: input.userId,
      metadata: { memberId: member.id }
    });

    return { ok: true };
  });
}
