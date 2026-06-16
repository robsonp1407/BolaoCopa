import type { PrismaClient } from "@prisma/client";

import type { RetroactivePredictionInput } from "@/lib/validations/retroactive-prediction";
import { recalculateRankingSnapshotsForPoolInTransaction } from "@/services/rankings/recalculate-ranking-snapshots";
import { getMatchRankingScopes } from "@/services/rankings/scope";
import {
  DEFAULT_POINTS_RULE,
  calculatePredictionPoints
} from "@/services/scoring/calculate-prediction-points";
import { createAuditLog } from "@/services/tournament/audit";

import { getPredictionContext, type PredictionClient } from "./context";
import { PredictionServiceError } from "./errors";
import { validatePredictionAgainstMatch } from "./rules";

type RetroactivePredictionServiceInput = RetroactivePredictionInput & {
  adminUserId: string;
};

export async function upsertRetroactivePrediction(
  prisma: PrismaClient,
  input: RetroactivePredictionServiceInput
) {
  return prisma.$transaction((tx) =>
    upsertRetroactivePredictionInTransaction(tx, input)
  );
}

export async function upsertRetroactivePredictionInTransaction(
  client: PredictionClient,
  input: RetroactivePredictionServiceInput
) {
  const { match } = await getPredictionContext(client, {
    poolId: input.poolId,
    userId: input.userId,
    matchId: input.matchId
  });

  validatePredictionAgainstMatch(
    {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      predictedWinnerTeamId: input.predictedWinnerTeamId
    },
    match
  );

  const existingPrediction = await client.prediction.findUnique({
    where: {
      poolId_userId_matchId: {
        poolId: input.poolId,
        userId: input.userId,
        matchId: input.matchId
      }
    }
  });

  const prediction = existingPrediction
    ? await updateRetroactivePrediction(client, input, existingPrediction)
    : await createRetroactivePrediction(client, input);

  const pointsHistory = await recalculateRetroactivePredictionPoints(client, {
    predictionId: prediction.id,
    poolId: input.poolId,
    userId: input.userId,
    matchId: input.matchId
  });

  await createAuditLog(client, {
    action: "PREDICTION_RETROACTIVE_UPSERT",
    entity: "Prediction",
    entityId: prediction.id,
    userId: input.adminUserId,
    metadata: {
      adminUserId: input.adminUserId,
      affectedUserId: input.userId,
      poolId: input.poolId,
      matchId: input.matchId,
      operation: existingPrediction ? "UPDATE" : "CREATE",
      insertedAt: new Date().toISOString(),
      payload: {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        predictedWinnerTeamId: input.predictedWinnerTeamId
      },
      previous: existingPrediction
        ? {
            homeScore: existingPrediction.homeScore,
            awayScore: existingPrediction.awayScore,
            predictedWinnerTeamId: existingPrediction.predictedWinnerTeamId
          }
        : null,
      pointsCalculated: pointsHistory !== null
    }
  });

  return {
    prediction,
    pointsHistory
  };
}

async function createRetroactivePrediction(
  client: PredictionClient,
  input: RetroactivePredictionServiceInput
) {
  const prediction = await client.prediction.create({
    data: {
      poolId: input.poolId,
      userId: input.userId,
      matchId: input.matchId,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      predictedWinnerTeamId: input.predictedWinnerTeamId,
      lockedAt: new Date()
    }
  });

  await client.predictionHistory.create({
    data: {
      predictionId: prediction.id,
      poolId: prediction.poolId,
      userId: prediction.userId,
      matchId: prediction.matchId,
      previousHomeScore: prediction.homeScore,
      previousAwayScore: prediction.awayScore,
      previousHomePenaltyScore: null,
      previousAwayPenaltyScore: null,
      previousWinnerTeamId: prediction.predictedWinnerTeamId,
      changedByUserId: input.adminUserId
    }
  });

  return prediction;
}

async function updateRetroactivePrediction(
  client: PredictionClient,
  input: RetroactivePredictionServiceInput,
  existingPrediction: {
    id: string;
    poolId: string;
    userId: string;
    matchId: string;
    homeScore: number;
    awayScore: number;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
    predictedWinnerTeamId: string | null;
  }
) {
  await client.predictionHistory.create({
    data: {
      predictionId: existingPrediction.id,
      poolId: existingPrediction.poolId,
      userId: existingPrediction.userId,
      matchId: existingPrediction.matchId,
      previousHomeScore: existingPrediction.homeScore,
      previousAwayScore: existingPrediction.awayScore,
      previousHomePenaltyScore: existingPrediction.homePenaltyScore,
      previousAwayPenaltyScore: existingPrediction.awayPenaltyScore,
      previousWinnerTeamId: existingPrediction.predictedWinnerTeamId,
      changedByUserId: input.adminUserId
    }
  });

  return client.prediction.update({
    where: { id: existingPrediction.id },
    data: {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      predictedWinnerTeamId: input.predictedWinnerTeamId,
      lockedAt: new Date()
    }
  });
}

async function recalculateRetroactivePredictionPoints(
  client: PredictionClient,
  input: {
    predictionId: string;
    poolId: string;
    userId: string;
    matchId: string;
  }
) {
  await client.pointsHistory.deleteMany({
    where: { predictionId: input.predictionId }
  });

  const prediction = await client.prediction.findUnique({
    where: { id: input.predictionId },
    include: {
      pool: { include: { scoreRule: true } },
      match: { include: { stage: true } }
    }
  });

  if (!prediction) {
    throw new PredictionServiceError(
      "Palpite retroativo nao encontrado apos gravacao",
      500,
      "RETROACTIVE_PREDICTION_NOT_FOUND"
    );
  }

  if (
    prediction.match.homeScore === null ||
    prediction.match.awayScore === null
  ) {
    return null;
  }

  const points = calculatePredictionPoints(
    prediction,
    prediction.match,
    prediction.pool.scoreRule ?? DEFAULT_POINTS_RULE
  );

  const pointsHistory = await client.pointsHistory.create({
    data: {
      poolId: input.poolId,
      userId: input.userId,
      matchId: input.matchId,
      predictionId: input.predictionId,
      resultPoints: points.resultPoints,
      exactScorePoints: points.exactScorePoints,
      knockoutWinnerPoints: points.knockoutWinnerPoints,
      singleTeamScorePoints: points.singleTeamScorePoints,
      totalPoints: points.totalPoints
    }
  });

  const groupMatches = prediction.match.groupId
    ? await client.match.findMany({
        where: { groupId: prediction.match.groupId },
        include: { stage: true }
      })
    : [];

  await recalculateRankingSnapshotsForPoolInTransaction(client, {
    poolId: input.poolId,
    scopes: getMatchRankingScopes(prediction.match, groupMatches)
  });

  return pointsHistory;
}
