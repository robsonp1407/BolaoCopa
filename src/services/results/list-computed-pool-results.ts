import type { PrismaClient } from "@prisma/client";

import { PoolServiceError } from "@/services/pools/errors";

type ListComputedPoolResultsInput = {
  poolId: string;
  userId: string;
};

type ComputedResultItem = {
  match: {
    id: string;
    matchNumber: number;
    startsAt: Date | null;
    homeScore: number;
    awayScore: number;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
    homeSlot: string | null;
    awaySlot: string | null;
    stage: { name: string };
    group: { code: string; name: string } | null;
    homeTeam: { name: string; flagEmoji: string | null } | null;
    awayTeam: { name: string; flagEmoji: string | null } | null;
  };
  computedPredictions: number;
  distributedPoints: number;
  lastCalculatedAt: Date;
};

export async function listComputedPoolResults(
  prisma: PrismaClient,
  input: ListComputedPoolResultsInput
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
      "Voce precisa participar deste bolao para ver os resultados",
      403,
      "POOL_MEMBERSHIP_REQUIRED"
    );
  }

  const points = await prisma.pointsHistory.findMany({
    where: {
      poolId: input.poolId,
      match: {
        homeScore: { not: null },
        awayScore: { not: null }
      }
    },
    select: {
      totalPoints: true,
      calculatedAt: true,
      match: {
        select: {
          id: true,
          matchNumber: true,
          startsAt: true,
          homeScore: true,
          awayScore: true,
          homePenaltyScore: true,
          awayPenaltyScore: true,
          homeSlot: true,
          awaySlot: true,
          stage: { select: { name: true } },
          group: { select: { code: true, name: true } },
          homeTeam: { select: { name: true, flagEmoji: true } },
          awayTeam: { select: { name: true, flagEmoji: true } }
        }
      }
    },
    orderBy: [{ match: { matchNumber: "asc" } }, { calculatedAt: "desc" }]
  });

  const itemsByMatchId = new Map<string, ComputedResultItem>();

  for (const point of points) {
    if (point.match.homeScore === null || point.match.awayScore === null) {
      continue;
    }

    const current = itemsByMatchId.get(point.match.id);

    if (!current) {
      itemsByMatchId.set(point.match.id, {
        match: {
          ...point.match,
          homeScore: point.match.homeScore,
          awayScore: point.match.awayScore
        },
        computedPredictions: 1,
        distributedPoints: point.totalPoints,
        lastCalculatedAt: point.calculatedAt
      });
      continue;
    }

    current.computedPredictions += 1;
    current.distributedPoints += point.totalPoints;

    if (point.calculatedAt > current.lastCalculatedAt) {
      current.lastCalculatedAt = point.calculatedAt;
    }
  }

  const items = Array.from(itemsByMatchId.values()).sort(
    (left, right) => left.match.matchNumber - right.match.matchNumber
  );

  return {
    pool: { id: pool.id, name: pool.name },
    summary: {
      computedMatches: items.length,
      computedPredictions: items.reduce(
        (total, item) => total + item.computedPredictions,
        0
      ),
      distributedPoints: items.reduce(
        (total, item) => total + item.distributedPoints,
        0
      )
    },
    items
  };
}
