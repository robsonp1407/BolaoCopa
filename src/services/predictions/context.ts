import type { Match, Pool, PoolMember, Prisma, PrismaClient, TournamentStage } from "@prisma/client";

import { createAuditLog } from "@/services/tournament/audit";

import { PredictionServiceError } from "./errors";
import { isPredictionOpen } from "./time";
import { poolAcceptsOfficialWorldCup } from "./tournament";

export type PredictionClient = PrismaClient | Prisma.TransactionClient;

export type PredictionMatch = Match & {
  stage: TournamentStage;
};

type PoolWithMembership = Pick<Pool, "id" | "status" | "tournamentId"> & {
  members: Pick<PoolMember, "userId" | "role">[];
};

export async function getPredictionContext(
  client: PredictionClient,
  input: {
    poolId: string;
    userId: string;
    matchId: string;
  }
): Promise<{ pool: PoolWithMembership; match: PredictionMatch }> {
  const pool = await client.pool.findUnique({
    where: { id: input.poolId },
    select: {
      id: true,
      status: true,
      tournamentId: true,
      members: {
        where: { userId: input.userId },
        select: { userId: true, role: true }
      }
    }
  });

  if (!pool || pool.status !== "ACTIVE") {
    throw new PredictionServiceError(
      "Bolao nao encontrado",
      404,
      "POOL_NOT_FOUND"
    );
  }

  if (pool.members.length === 0) {
    throw new PredictionServiceError(
      "Voce precisa participar deste bolao para palpitar",
      403,
      "POOL_MEMBERSHIP_REQUIRED"
    );
  }

  if (!poolAcceptsOfficialWorldCup(pool.tournamentId)) {
    throw new PredictionServiceError(
      "A partida nao pertence ao torneio deste bolao",
      400,
      "MATCH_OUTSIDE_POOL_TOURNAMENT"
    );
  }

  const match = await client.match.findUnique({
    where: { id: input.matchId },
    include: { stage: true }
  });

  if (!match) {
    throw new PredictionServiceError(
      "Jogo nao encontrado",
      404,
      "MATCH_NOT_FOUND"
    );
  }

  return { pool, match };
}

export async function assertPredictionIsOpen(
  client: PredictionClient,
  input: {
    poolId: string;
    userId: string;
    match: Pick<PredictionMatch, "id" | "startsAt">;
    now?: Date;
  }
) {
  if (isPredictionOpen(input.match.startsAt, input.now)) {
    return;
  }

  const existingPrediction = await client.prediction.findUnique({
    where: {
      poolId_userId_matchId: {
        poolId: input.poolId,
        userId: input.userId,
        matchId: input.match.id
      }
    },
    select: { id: true, lockedAt: true }
  });

  if (existingPrediction && !existingPrediction.lockedAt) {
    await client.prediction.update({
      where: { id: existingPrediction.id },
      data: { lockedAt: new Date() }
    });
  }

  await createAuditLog(client, {
    action: "PREDICTION_LOCKED_ATTEMPT",
    entity: "Prediction",
    entityId: existingPrediction?.id,
    userId: input.userId,
    metadata: {
      poolId: input.poolId,
      matchId: input.match.id,
      startsAt: input.match.startsAt?.toISOString() ?? null
    }
  });

  throw new PredictionServiceError(
    "O prazo para palpitar neste jogo ja encerrou",
    409,
    "PREDICTION_LOCKED"
  );
}
