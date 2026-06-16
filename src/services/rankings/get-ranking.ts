import type { PrismaClient } from "@prisma/client";

import type { RankingQueryInput } from "@/lib/validations/ranking";
import { PoolServiceError } from "@/services/pools/errors";

export async function getPoolRanking(
  prisma: PrismaClient,
  input: RankingQueryInput & {
    poolId: string;
    userId: string;
  }
) {
  const pool = await prisma.pool.findUnique({
    where: { id: input.poolId },
    select: {
      id: true,
      name: true,
      status: true,
      members: {
        where: { userId: input.userId },
        select: { userId: true }
      }
    }
  });

  if (!pool || pool.status !== "ACTIVE") {
    throw new PoolServiceError("Bolao nao encontrado", 404, "POOL_NOT_FOUND");
  }

  if (pool.members.length === 0) {
    throw new PoolServiceError(
      "Voce precisa participar deste bolao para ver o ranking",
      403,
      "POOL_MEMBERSHIP_REQUIRED"
    );
  }

  const where = {
    poolId: input.poolId,
    scope: input.scope,
    scopeKey: input.scopeKey
  };
  const skip = (input.page - 1) * input.pageSize;

  const [total, ranking] = await Promise.all([
    prisma.rankingSnapshot.count({ where }),
    prisma.rankingSnapshot.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { position: "asc" },
      skip,
      take: input.pageSize
    })
  ]);

  return {
    pool: { id: pool.id, name: pool.name },
    scope: input.scope,
    scopeKey: input.scopeKey,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize)
    },
    ranking
  };
}
