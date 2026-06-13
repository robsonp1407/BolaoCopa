import type { Prediction, Prisma } from "@prisma/client";

import type { PredictionPayload } from "@/lib/validations/prediction";
import { createAuditLog } from "@/services/tournament/audit";

import {
  assertPredictionIsOpen,
  getPredictionContext,
  type PredictionClient
} from "./context";
import { validatePredictionAgainstMatch } from "./rules";

type UpsertPredictionInput = {
  poolId: string;
  userId: string;
  matchId: string;
  data: PredictionPayload;
  now?: Date;
};

export async function upsertPrediction(
  client: PredictionClient,
  input: UpsertPredictionInput
): Promise<Prediction> {
  const { match } = await getPredictionContext(client, input);

  await assertPredictionIsOpen(client, {
    poolId: input.poolId,
    userId: input.userId,
    match,
    now: input.now
  });

  validatePredictionAgainstMatch(input.data, match);

  const existingPrediction = await client.prediction.findUnique({
    where: {
      poolId_userId_matchId: {
        poolId: input.poolId,
        userId: input.userId,
        matchId: input.matchId
      }
    }
  });

  if (!existingPrediction) {
    const prediction = await client.prediction.create({
      data: buildPredictionData(input)
    });

    await createAuditLog(client, {
      action: "PREDICTION_CREATED",
      entity: "Prediction",
      entityId: prediction.id,
      userId: input.userId,
      metadata: { poolId: input.poolId, matchId: input.matchId }
    });

    return prediction;
  }

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
      changedByUserId: input.userId
    }
  });

  const prediction = await client.prediction.update({
    where: { id: existingPrediction.id },
    data: buildPredictionUpdateData(input.data)
  });

  await createAuditLog(client, {
    action: "PREDICTION_UPDATED",
    entity: "Prediction",
    entityId: prediction.id,
    userId: input.userId,
    metadata: { poolId: input.poolId, matchId: input.matchId }
  });

  return prediction;
}

function buildPredictionData(
  input: UpsertPredictionInput
): Prisma.PredictionUncheckedCreateInput {
  return {
    poolId: input.poolId,
    userId: input.userId,
    matchId: input.matchId,
    homeScore: input.data.homeScore,
    awayScore: input.data.awayScore,
    homePenaltyScore: input.data.homePenaltyScore,
    awayPenaltyScore: input.data.awayPenaltyScore,
    predictedWinnerTeamId: input.data.predictedWinnerTeamId
  };
}

function buildPredictionUpdateData(
  data: PredictionPayload
): Prisma.PredictionUncheckedUpdateInput {
  return {
    homeScore: data.homeScore,
    awayScore: data.awayScore,
    homePenaltyScore: data.homePenaltyScore,
    awayPenaltyScore: data.awayPenaltyScore,
    predictedWinnerTeamId: data.predictedWinnerTeamId
  };
}
