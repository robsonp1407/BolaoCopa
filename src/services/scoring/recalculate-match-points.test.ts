import { describe, expect, it, vi } from "vitest";

import {
  recalculateMatchPoints,
  recalculateMatchPointsInTransaction
} from "./recalculate-match-points";

const finishedMatch = {
  id: "match-1",
  homeScore: 2,
  awayScore: 1,
  homeTeamId: "home-team",
  awayTeamId: "away-team",
  winnerTeamId: "home-team",
  matchNumber: 1,
  groupId: "group-a",
  startsAt: new Date("2026-06-11T19:00:00.000Z"),
  stage: { code: "GROUP_STAGE", isKnockout: false }
};

function createTxMock(match = finishedMatch) {
  return {
    match: {
      findUnique: vi.fn(async () => match),
      findMany: vi.fn(async () => [match])
    },
    pointsHistory: {
      deleteMany: vi.fn(async () => ({ count: 2 })),
      createMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => [
        {
          poolId: "pool-1",
          userId: "user-1",
          totalPoints: 5,
          exactScorePoints: 2,
          resultPoints: 3,
          prediction: { createdAt: new Date("2026-06-11T12:00:00.000Z") }
        }
      ])
    },
    rankingSnapshot: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
      createMany: vi.fn(async () => ({ count: 1 }))
    },
    prediction: {
      findMany: vi.fn(async () => [
        {
          id: "prediction-1",
          poolId: "pool-1",
          userId: "user-1",
      matchId: "match-1",
      homeScore: 2,
      awayScore: 1,
      predictedWinnerTeamId: null,
          pool: {
            scoreRule: {
              exactScorePoints: 2,
              winnerPoints: 3,
              knockoutWinnerPoints: 1,
              singleTeamScorePoints: 1
            }
          }
        }
      ])
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    }
  };
}

describe("recalculateMatchPoints", () => {
  it("runs inside a transaction", async () => {
    const tx = createTxMock();
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx))
    };

    const summary = await recalculateMatchPoints(prisma as never, {
      matchId: "match-1",
      userId: "admin-1"
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(summary).toEqual({
      matchId: "match-1",
      processedPredictions: 1,
      createdPointsHistories: 1,
      deletedPointsHistories: 2,
      rankingSnapshots: [
        {
          poolId: "pool-1",
          createdSnapshots: 2,
          deletedSnapshots: 0
        }
      ]
    });
  });

  it("deletes old rows and creates fresh points histories", async () => {
    const tx = createTxMock();

    await recalculateMatchPointsInTransaction(tx as never, {
      matchId: "match-1",
      userId: "admin-1"
    });

    expect(tx.pointsHistory.deleteMany).toHaveBeenCalledWith({
      where: { matchId: "match-1" }
    });
    expect(tx.pointsHistory.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          predictionId: "prediction-1",
          poolId: "pool-1",
          userId: "user-1",
          matchId: "match-1",
          resultPoints: 3,
          exactScorePoints: 2,
          knockoutWinnerPoints: 0,
          singleTeamScorePoints: 0,
          totalPoints: 5
        })
      ]
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "POINTS_RECALCULATED" })
      })
    );
    expect(tx.rankingSnapshot.createMany).toHaveBeenCalled();
  });

  it("clears points when official score is removed", async () => {
    const tx = createTxMock({
      ...finishedMatch,
      homeScore: null,
      awayScore: null,
      winnerTeamId: null
    });
    tx.pointsHistory.findMany
      .mockResolvedValueOnce([{ poolId: "pool-1" }])
      .mockResolvedValue([]);

    const summary = await recalculateMatchPointsInTransaction(tx as never, {
      matchId: "match-1",
      userId: "admin-1"
    });

    expect(summary).toMatchObject({
      processedPredictions: 0,
      createdPointsHistories: 0,
      deletedPointsHistories: 2,
      rankingSnapshots: [
        {
          poolId: "pool-1",
          createdSnapshots: 0,
          deletedSnapshots: 0
        }
      ]
    });
    expect(tx.prediction.findMany).not.toHaveBeenCalled();
    expect(tx.pointsHistory.createMany).not.toHaveBeenCalled();
  });
});
