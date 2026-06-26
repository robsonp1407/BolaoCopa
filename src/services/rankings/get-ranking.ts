import type { PrismaClient } from "@prisma/client";

import type { RankingQueryInput } from "@/lib/validations/ranking";
import { PoolServiceError } from "@/services/pools/errors";

import { getGroupRound } from "./scope";

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

  const scopeMatchIds = await getScopeFinishedMatchIds(prisma, input);

  const [total, ranking, predictionMetrics, totalPredictions] =
    await Promise.all([
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
      }),
      getRankingPredictionMetrics(prisma, {
        poolId: input.poolId,
        matchIds: scopeMatchIds
      }),
      scopeMatchIds.length > 0
        ? prisma.prediction.count({
            where: {
              poolId: input.poolId,
              matchId: { in: scopeMatchIds }
            }
          })
        : Promise.resolve(0)
    ]);
  const rankingWithMetrics = ranking.map((entry) => ({
    ...entry,
    predictionStats: predictionMetrics.get(entry.userId) ?? {
      predictionsCount: 0,
      singleTeamScoreHits: 0,
      noPointPredictions: 0
    }
  }));

  return {
    pool: { id: pool.id, name: pool.name },
    scope: input.scope,
    scopeKey: input.scopeKey,
    scopeStats: {
      totalMatches: scopeMatchIds.length,
      totalPredictions
    },
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize)
    },
    ranking: rankingWithMetrics
  };
}

async function getScopeFinishedMatchIds(
  prisma: PrismaClient,
  input: Pick<RankingQueryInput, "scope" | "scopeKey">
) {
  const matches = await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
      ...(input.scope === "KNOCKOUT_STAGE"
        ? { stage: { code: input.scopeKey, isKnockout: true } }
        : input.scope === "GENERAL"
          ? {}
          : { stage: { isKnockout: false }, groupId: { not: null } })
    },
    include: { stage: true }
  });

  if (input.scope !== "GROUP_ROUND") {
    return matches.map((match) => match.id);
  }

  const groupMatches = await prisma.match.findMany({
    where: {
      stage: { isKnockout: false },
      groupId: { not: null }
    },
    include: { stage: true }
  });

  return matches
    .filter(
      (match) =>
        `ROUND_${getGroupRound(match, groupMatches)}` === input.scopeKey
    )
    .map((match) => match.id);
}

async function getRankingPredictionMetrics(
  prisma: PrismaClient,
  input: {
    poolId: string;
    matchIds: string[];
  }
) {
  const metrics = new Map<
    string,
    {
      predictionsCount: number;
      singleTeamScoreHits: number;
      noPointPredictions: number;
    }
  >();

  if (input.matchIds.length === 0) {
    return metrics;
  }

  const points = await prisma.pointsHistory.findMany({
    where: {
      poolId: input.poolId,
      matchId: { in: input.matchIds }
    },
    select: {
      userId: true,
      singleTeamScorePoints: true,
      totalPoints: true
    }
  });

  for (const point of points) {
    const current = metrics.get(point.userId) ?? {
      predictionsCount: 0,
      singleTeamScoreHits: 0,
      noPointPredictions: 0
    };

    current.predictionsCount += 1;

    if (point.singleTeamScorePoints > 0) {
      current.singleTeamScoreHits += 1;
    }

    if (point.totalPoints === 0) {
      current.noPointPredictions += 1;
    }

    metrics.set(point.userId, current);
  }

  return metrics;
}
