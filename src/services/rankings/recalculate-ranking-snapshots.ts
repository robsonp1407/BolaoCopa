import type { Prisma, PrismaClient } from "@prisma/client";

import { rankEntries } from "./rank-entries";
import type { RankingEntryInput, RankingScopeInput } from "./types";

export type RankingClient = PrismaClient | Prisma.TransactionClient;

export type RankingRecalculationSummary = {
  poolId: string;
  scopes: RankingScopeInput[];
  createdSnapshots: number;
  deletedSnapshots: number;
};

type RecalculateRankingSnapshotsInput = {
  poolId: string;
  scopes: RankingScopeInput[];
};

export async function recalculateRankingSnapshotsForPool(
  prisma: PrismaClient,
  input: RecalculateRankingSnapshotsInput
) {
  return prisma.$transaction((tx) =>
    recalculateRankingSnapshotsForPoolInTransaction(tx, input)
  );
}

export async function recalculateRankingSnapshotsForPoolInTransaction(
  client: RankingClient,
  input: RecalculateRankingSnapshotsInput
): Promise<RankingRecalculationSummary> {
  let createdSnapshots = 0;
  let deletedSnapshots = 0;

  for (const scopeInput of input.scopes) {
    const deleted = await client.rankingSnapshot.deleteMany({
      where: {
        poolId: input.poolId,
        scope: scopeInput.scope,
        scopeKey: scopeInput.scopeKey
      }
    });
    deletedSnapshots += deleted.count;

    const rankedEntries = rankEntries(
      await getRankingEntries(client, input.poolId, scopeInput)
    );

    if (rankedEntries.length > 0) {
      await client.rankingSnapshot.createMany({
        data: rankedEntries.map((entry) => ({
          poolId: entry.poolId,
          userId: entry.userId,
          scope: scopeInput.scope,
          scopeKey: scopeInput.scopeKey,
          position: entry.position,
          totalPoints: entry.totalPoints,
          exactScoreHits: entry.exactScoreHits,
          resultHits: entry.resultHits,
          earliestPrediction: entry.earliestPrediction
        }))
      });
      createdSnapshots += rankedEntries.length;
    }
  }

  return {
    poolId: input.poolId,
    scopes: input.scopes,
    createdSnapshots,
    deletedSnapshots
  };
}

async function getRankingEntries(
  client: RankingClient,
  poolId: string,
  scopeInput: RankingScopeInput
): Promise<RankingEntryInput[]> {
  const pointsRows = await client.pointsHistory.findMany({
    where: {
      poolId,
      match: buildMatchFilter(scopeInput)
    },
    include: {
      prediction: {
        select: { createdAt: true }
      }
    }
  });

  const entriesByUser = new Map<string, RankingEntryInput>();

  for (const row of pointsRows) {
    const current = entriesByUser.get(row.userId) ?? {
      poolId,
      userId: row.userId,
      totalPoints: 0,
      exactScoreHits: 0,
      resultHits: 0,
      earliestPrediction: null
    };

    current.totalPoints += row.totalPoints;
    current.exactScoreHits += row.exactScorePoints > 0 ? 1 : 0;
    current.resultHits += row.resultPoints > 0 ? 1 : 0;
    current.earliestPrediction = getEarlierDate(
      current.earliestPrediction,
      row.prediction.createdAt
    );

    entriesByUser.set(row.userId, current);
  }

  return Array.from(entriesByUser.values());
}

function buildMatchFilter(scopeInput: RankingScopeInput): Prisma.MatchWhereInput {
  if (scopeInput.scope === "GENERAL") {
    return {};
  }

  if (scopeInput.scope === "KNOCKOUT_STAGE") {
    return {
      stage: {
        code: scopeInput.scopeKey,
        isKnockout: true
      }
    };
  }

  const roundNumber = Number(scopeInput.scopeKey.replace("ROUND_", ""));

  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    return { id: "__invalid_group_round__" };
  }

  return {
    stage: { isKnockout: false },
    groupId: { not: null },
    OR: buildGroupRoundMatchNumberRanges(roundNumber)
  };
}

function buildGroupRoundMatchNumberRanges(roundNumber: number) {
  const ranges = [];

  for (let groupIndex = 0; groupIndex < 12; groupIndex += 1) {
    const firstGroupMatchNumber = groupIndex * 6 + 1;
    const firstRoundMatchNumber = firstGroupMatchNumber + (roundNumber - 1) * 2;

    ranges.push({
      matchNumber: {
        gte: firstRoundMatchNumber,
        lte: firstRoundMatchNumber + 1
      }
    });
  }

  return ranges;
}

function getEarlierDate(current: Date | null, candidate: Date) {
  if (!current || candidate.getTime() < current.getTime()) {
    return candidate;
  }

  return current;
}
