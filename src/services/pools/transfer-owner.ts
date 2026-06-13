import type { PrismaClient, Role } from "@prisma/client";

import { createAuditLog } from "@/services/tournament/audit";

import { PoolServiceError } from "./errors";
import { canDeletePool } from "./permissions";

export async function transferPoolOwner(
  prisma: PrismaClient,
  input: {
    poolId: string;
    newOwnerUserId: string;
    actorUserId: string;
    actorRole: Role;
  }
) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.pool.findUnique({
      where: { id: input.poolId },
      include: {
        members: true
      }
    });

    if (!pool || pool.status !== "ACTIVE") {
      throw new PoolServiceError("Bolao nao encontrado", 404, "POOL_NOT_FOUND");
    }

    const actorMember = pool.members.find(
      (member) => member.userId === input.actorUserId
    );

    if (!canDeletePool(input.actorRole, actorMember?.role)) {
      throw new PoolServiceError("Acesso negado", 403, "POOL_FORBIDDEN");
    }

    const newOwnerMember = pool.members.find(
      (member) => member.userId === input.newOwnerUserId
    );

    if (!newOwnerMember) {
      throw new PoolServiceError(
        "Novo proprietario precisa ser membro do bolao",
        404,
        "NEW_OWNER_NOT_MEMBER"
      );
    }

    await tx.pool.update({
      where: { id: pool.id },
      data: { ownerId: input.newOwnerUserId }
    });
    await tx.poolMember.update({
      where: { id: newOwnerMember.id },
      data: { role: "OWNER" }
    });

    const previousOwner = pool.members.find((member) => member.role === "OWNER");
    if (previousOwner && previousOwner.id !== newOwnerMember.id) {
      await tx.poolMember.update({
        where: { id: previousOwner.id },
        data: { role: "ADMIN" }
      });
    }

    await createAuditLog(tx, {
      action: "POOL_OWNER_TRANSFERRED",
      entity: "Pool",
      entityId: pool.id,
      userId: input.actorUserId,
      metadata: {
        previousOwnerId: pool.ownerId,
        newOwnerId: input.newOwnerUserId
      }
    });

    return { ok: true };
  });
}
