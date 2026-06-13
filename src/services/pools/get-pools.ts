import type { PrismaClient } from "@prisma/client";

export async function listVisiblePools(
  prisma: PrismaClient,
  input: { userId?: string }
) {
  const visibilityFilters = input.userId
    ? [
        { isPrivate: false },
        {
          members: {
            some: { userId: input.userId }
          }
        }
      ]
    : [{ isPrivate: false }];

  return prisma.pool.findMany({
    where: {
      status: "ACTIVE",
      OR: visibilityFilters
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getPoolDetails(
  prisma: PrismaClient,
  input: { poolId: string; userId?: string }
) {
  const visibilityFilters = input.userId
    ? [
        { isPrivate: false },
        {
          members: {
            some: { userId: input.userId }
          }
        }
      ]
    : [{ isPrivate: false }];

  const pool = await prisma.pool.findFirst({
    where: {
      id: input.poolId,
      status: "ACTIVE",
      OR: visibilityFilters
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { joinedAt: "asc" }
      },
      scoreRule: true
    }
  });

  return pool;
}
