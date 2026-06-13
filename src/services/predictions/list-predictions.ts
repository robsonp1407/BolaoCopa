import type { PrismaClient } from "@prisma/client";

import { PredictionServiceError } from "./errors";
import { isPredictionOpen } from "./time";
import { poolAcceptsOfficialWorldCup } from "./tournament";

type ListPredictionsInput = {
  poolId: string;
  userId: string;
  now?: Date;
};

export async function listPredictions(
  prisma: PrismaClient,
  input: ListPredictionsInput
) {
  const pool = await prisma.pool.findUnique({
    where: { id: input.poolId },
    select: {
      id: true,
      name: true,
      status: true,
      tournamentId: true,
      members: {
        where: { userId: input.userId },
        select: { userId: true }
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
      "Voce precisa participar deste bolao para ver os palpites",
      403,
      "POOL_MEMBERSHIP_REQUIRED"
    );
  }

  if (!poolAcceptsOfficialWorldCup(pool.tournamentId)) {
    throw new PredictionServiceError(
      "Este bolao nao pertence ao torneio oficial importado",
      400,
      "MATCH_OUTSIDE_POOL_TOURNAMENT"
    );
  }

  const [matches, predictions] = await Promise.all([
    prisma.match.findMany({
      include: {
        stage: true,
        group: true,
        stadium: { include: { city: true } },
        homeTeam: true,
        awayTeam: true
      },
      orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }]
    }),
    prisma.prediction.findMany({
      where: { poolId: input.poolId, userId: input.userId }
    })
  ]);

  const predictionsByMatchId = new Map(
    predictions.map((prediction) => [prediction.matchId, prediction])
  );

  const items = matches.map((match) => {
    const prediction = predictionsByMatchId.get(match.id) ?? null;
    const isOpen = isPredictionOpen(match.startsAt, input.now);

    return {
      match,
      prediction,
      isOpen,
      isLocked: !isOpen,
      isPending: isOpen && !prediction
    };
  });

  return {
    pool: { id: pool.id, name: pool.name },
    summary: {
      totalGames: items.length,
      totalAvailable: items.filter((item) => item.isOpen).length,
      totalFilled: items.filter((item) => item.prediction).length,
      totalPending: items.filter((item) => item.isPending).length,
      totalLocked: items.filter((item) => item.isLocked).length
    },
    items
  };
}
