import type { PoolMemberRole, PrismaClient, Role } from "@prisma/client";

import { createAuditLog } from "@/services/tournament/audit";

import { PoolServiceError } from "./errors";
import { canDeletePool } from "./permissions";

export async function deletePool(
  prisma: PrismaClient,
  input: { poolId: string; userId: string; userRole: Role }
) {
  const memberRole = await getPoolMemberRole(prisma, input.poolId, input.userId);

  if (!canDeletePool(input.userRole, memberRole)) {
    throw new PoolServiceError("Acesso negado", 403, "POOL_FORBIDDEN");
  }

  const pool = await prisma.pool.update({
    where: { id: input.poolId },
    data: {
      status: "DELETED",
      deletedAt: new Date()
    }
  });

  await createAuditLog(prisma, {
    action: "POOL_DELETED",
    entity: "Pool",
    entityId: pool.id,
    userId: input.userId,
    metadata: { slug: pool.slug }
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
