import type { Prisma, PrismaClient } from "@prisma/client";

import { createAuditLog } from "@/services/tournament/audit";
import { recalculateRankingSnapshotsForPoolInTransaction } from "@/services/rankings/recalculate-ranking-snapshots";
import { getMatchRankingScopes } from "@/services/rankings/scope";

import {
  DEFAULT_POINTS_RULE,
  calculatePredictionPoints
} from "./calculate-prediction-points";
import type { PointsBreakdown, ScoreRuleValues } from "./types";

export type ScoringClient = PrismaClient | Prisma.TransactionClient;

export type RecalculateMatchPointsSummary = {
  matchId: string;
  processedPredictions: number;
  createdPointsHistories: number;
  deletedPointsHistories: number;
  rankingSnapshots: {
    poolId: string;
    createdSnapshots: number;
    deletedSnapshots: number;
  }[];
};

type RecalculateMatchPointsInput = {
  matchId: string;
  userId?: string | null;
};

export async function recalculateMatchPoints(
  prisma: PrismaClient,
  input: RecalculateMatchPointsInput
) {
  return prisma.$transaction((tx) =>
    recalculateMatchPointsInTransaction(tx, input)
  );
}

export async function recalculateMatchPointsInTransaction(
  client: ScoringClient,
  input: RecalculateMatchPointsInput
): Promise<RecalculateMatchPointsSummary> {
  const match = await client.match.findUnique({
    where: { id: input.matchId },
    include: { stage: true }
  });

  if (!match) {
    throw new Error("Jogo nao encontrado para recalculo de pontos");
  }

  const previousPoints = await client.pointsHistory.findMany({
    where: { matchId: input.matchId },
    select: { poolId: true }
  });

  const deletedPoints = await client.pointsHistory.deleteMany({
    where: { matchId: input.matchId }
  });

  const affectedPoolIds = new Set(previousPoints.map((point) => point.poolId));
  const scopes = await getScopesForMatch(client, match);

  if (match.homeScore === null || match.awayScore === null) {
    const rankingSnapshots = await recalculateAffectedPools(client, {
      affectedPoolIds,
      scopes
    });
    const summary = {
      matchId: input.matchId,
      processedPredictions: 0,
      createdPointsHistories: 0,
      deletedPointsHistories: deletedPoints.count,
      rankingSnapshots
    };

    await createPointsAudit(client, input.userId, summary);
    return summary;
  }

  const predictions = await client.prediction.findMany({
    where: {
      matchId: input.matchId,
      pool: { status: "ACTIVE" }
    },
    include: {
      pool: {
        include: { scoreRule: true }
      }
    }
  });

  const histories = predictions.map((prediction) => {
    affectedPoolIds.add(prediction.poolId);
    const points = calculatePredictionPoints(
      prediction,
      match,
      buildRuleValues(prediction.pool.scoreRule)
    );

    return buildPointsHistoryCreateInput(prediction, points);
  });

  if (histories.length > 0) {
    await client.pointsHistory.createMany({ data: histories });
  }

  const summary = {
    matchId: input.matchId,
    processedPredictions: predictions.length,
    createdPointsHistories: histories.length,
    deletedPointsHistories: deletedPoints.count,
    rankingSnapshots: await recalculateAffectedPools(client, {
      affectedPoolIds,
      scopes
    })
  };

  await createPointsAudit(client, input.userId, summary);

  return summary;
}

async function getScopesForMatch(
  client: ScoringClient,
  match: Parameters<typeof getMatchRankingScopes>[0]
) {
  if (!match.groupId) {
    return getMatchRankingScopes(match);
  }

  const groupMatches = await client.match.findMany({
    where: { groupId: match.groupId },
    include: { stage: true }
  });

  return getMatchRankingScopes(match, groupMatches);
}

async function recalculateAffectedPools(
  client: ScoringClient,
  input: {
    affectedPoolIds: Set<string>;
    scopes: ReturnType<typeof getMatchRankingScopes>;
  }
) {
  const summaries = [];

  for (const poolId of input.affectedPoolIds) {
    const summary = await recalculateRankingSnapshotsForPoolInTransaction(
      client,
      {
        poolId,
        scopes: input.scopes
      }
    );

    summaries.push({
      poolId,
      createdSnapshots: summary.createdSnapshots,
      deletedSnapshots: summary.deletedSnapshots
    });
  }

  return summaries;
}

function buildRuleValues(scoreRule: ScoreRuleValues | null): ScoreRuleValues {
  return scoreRule ?? DEFAULT_POINTS_RULE;
}

function buildPointsHistoryCreateInput(
  prediction: {
    id: string;
    poolId: string;
    userId: string;
    matchId: string;
  },
  points: PointsBreakdown
): Prisma.PointsHistoryCreateManyInput {
  return {
    poolId: prediction.poolId,
    userId: prediction.userId,
    matchId: prediction.matchId,
    predictionId: prediction.id,
    resultPoints: points.resultPoints,
    exactScorePoints: points.exactScorePoints,
    knockoutWinnerPoints: points.knockoutWinnerPoints,
    singleTeamScorePoints: points.singleTeamScorePoints,
    totalPoints: points.totalPoints
  };
}

async function createPointsAudit(
  client: ScoringClient,
  userId: string | null | undefined,
  summary: RecalculateMatchPointsSummary
) {
  await createAuditLog(client, {
    action: "POINTS_RECALCULATED",
    entity: "Match",
    entityId: summary.matchId,
    userId,
    metadata: summary
  });
}
