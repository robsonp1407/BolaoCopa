import type { PrismaClient } from "@prisma/client";

import { verifyPassword } from "@/lib/security/password";
import type { JoinPoolInput } from "@/lib/validations/pool";
import { createAuditLog } from "@/services/tournament/audit";

import { PoolServiceError } from "./errors";

export async function joinPool(
  prisma: PrismaClient,
  input: JoinPoolInput & { userId: string }
) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.pool.findUnique({
      where: { joinCode: input.joinCode },
      include: {
        members: {
          select: { userId: true }
        }
      }
    });

    if (!pool || pool.status !== "ACTIVE") {
      throw new PoolServiceError("Codigo de bolao invalido", 404, "POOL_NOT_FOUND");
    }

    if (pool.members.some((member) => member.userId === input.userId)) {
      throw new PoolServiceError(
        "Usuario ja participa deste bolao",
        409,
        "POOL_MEMBER_DUPLICATE"
      );
    }

    if (
      pool.maxParticipants !== null &&
      pool.members.length >= pool.maxParticipants
    ) {
      throw new PoolServiceError(
        "Limite de participantes atingido",
        409,
        "POOL_PARTICIPANT_LIMIT"
      );
    }

    if (pool.isPrivate || pool.passwordHash) {
      if (!pool.passwordHash) {
        throw new PoolServiceError("Senha do bolao invalida", 403, "POOL_PASSWORD_INVALID");
      }

      const passwordMatches =
        input.password &&
        (await verifyPassword(input.password, pool.passwordHash));

      if (!passwordMatches) {
        throw new PoolServiceError("Senha do bolao invalida", 403, "POOL_PASSWORD_INVALID");
      }
    }

    const member = await tx.poolMember.create({
      data: {
        poolId: pool.id,
        userId: input.userId,
        role: "MEMBER"
      }
    });

    await createAuditLog(tx, {
      action: "POOL_JOINED",
      entity: "Pool",
      entityId: pool.id,
      userId: input.userId,
      metadata: { joinCode: pool.joinCode }
    });

    return member;
  });
}
