import type { Prediction, PrismaClient } from "@prisma/client";

import type { QuickPredictionsPayload } from "@/lib/validations/prediction";
import { createAuditLog } from "@/services/tournament/audit";

import { getPredictionContext } from "./context";
import { PredictionServiceError } from "./errors";
import { validatePredictionAgainstMatch } from "./rules";
import { isPredictionOpen } from "./time";
import { upsertPrediction } from "./upsert-prediction";

type QuickSaveInput = {
  poolId: string;
  userId: string;
  data: QuickPredictionsPayload;
  now?: Date;
};

export async function quickSavePredictions(
  prisma: PrismaClient,
  input: QuickSaveInput
): Promise<Prediction[]> {
  const duplicatedMatchIds = findDuplicatedMatchIds(
    input.data.predictions.map((prediction) => prediction.matchId)
  );

  if (duplicatedMatchIds.length > 0) {
    throw new PredictionServiceError(
      "O lote contem palpites duplicados para o mesmo jogo",
      400,
      "PREDICTION_BATCH_DUPLICATED_MATCH",
      { duplicatedMatchIds }
    );
  }

  const blockedMatchIds: string[] = [];

  for (const prediction of input.data.predictions) {
    const { match } = await getPredictionContext(prisma, {
      poolId: input.poolId,
      userId: input.userId,
      matchId: prediction.matchId
    });

    validatePredictionAgainstMatch(prediction, match);

    if (!isPredictionOpen(match.startsAt, input.now)) {
      blockedMatchIds.push(prediction.matchId);
    }
  }

  if (blockedMatchIds.length > 0) {
    await createAuditLog(prisma, {
      action: "PREDICTION_LOCKED_ATTEMPT",
      entity: "Prediction",
      userId: input.userId,
      metadata: { poolId: input.poolId, blockedMatchIds }
    });

    throw new PredictionServiceError(
      "Um ou mais jogos ja estao bloqueados para palpite",
      409,
      "PREDICTION_BATCH_LOCKED",
      { blockedMatchIds }
    );
  }

  return prisma.$transaction(async (tx) => {
    const predictions: Prediction[] = [];

    for (const prediction of input.data.predictions) {
      predictions.push(
        await upsertPrediction(tx, {
          poolId: input.poolId,
          userId: input.userId,
          matchId: prediction.matchId,
          data: prediction,
          now: input.now
        })
      );
    }

    await createAuditLog(tx, {
      action: "PREDICTION_QUICK_SAVE",
      entity: "Prediction",
      userId: input.userId,
      metadata: {
        poolId: input.poolId,
        matchIds: input.data.predictions.map((prediction) => prediction.matchId)
      }
    });

    return predictions;
  });
}

function findDuplicatedMatchIds(matchIds: string[]) {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  for (const matchId of matchIds) {
    if (seen.has(matchId)) {
      duplicated.add(matchId);
    }

    seen.add(matchId);
  }

  return Array.from(duplicated);
}
