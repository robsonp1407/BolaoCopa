import type { PoolMemberRole, PrismaClient, Role } from "@prisma/client";

import { hashPassword } from "@/lib/security/password";
import type { UpdatePoolInput } from "@/lib/validations/pool";
import { createAuditLog } from "@/services/tournament/audit";

import { PoolServiceError } from "./errors";
import { canManagePool } from "./permissions";

export async function updatePool(
  prisma: PrismaClient,
  input: {
    poolId: string;
    userId: string;
    userRole: Role;
    data: UpdatePoolInput;
  }
) {
  const memberRole = await getPoolMemberRole(prisma, input.poolId, input.userId);

  if (!canManagePool(input.userRole, memberRole)) {
    throw new PoolServiceError("Acesso negado", 403, "POOL_FORBIDDEN");
  }

  const passwordHash =
    input.data.password === undefined
      ? undefined
      : input.data.password
        ? await hashPassword(input.data.password)
        : null;

  const pool = await prisma.pool.update({
    where: { id: input.poolId },
    data: {
      name: input.data.name,
      description: input.data.description,
      imageUrl: input.data.imageUrl,
      isPrivate: input.data.isPrivate,
      passwordHash,
      maxParticipants: input.data.maxParticipants
    }
  });

  await createAuditLog(prisma, {
    action: "POOL_UPDATED",
    entity: "Pool",
    entityId: pool.id,
    userId: input.userId,
    metadata: { fields: Object.keys(input.data) }
  });

  return pool;
}

async function getPoolMemberRole(
  prisma: PrismaClient,
  poolId: string,
  userId: string
): Promise<PoolMemberRole | undefined> {
  const member = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId } },
    select: { role: true }
  });

  return member?.role;
}
