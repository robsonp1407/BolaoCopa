import { describe, expect, it, vi } from "vitest";

import { upsertRetroactivePredictionInTransaction } from "./retroactive-prediction";

function createClientMock() {
  const prediction = {
    id: "prediction-1",
    poolId: "pool-1",
    userId: "user-1",
    matchId: "match-1",
    homeScore: 2,
    awayScore: 1,
    homePenaltyScore: null,
    awayPenaltyScore: null,
    predictedWinnerTeamId: null
  };

  return {
    pool: {
      findUnique: vi.fn(async () => ({
        id: "pool-1",
        status: "ACTIVE",
        tournamentId: null,
        members: [{ userId: "user-1", role: "MEMBER" }]
      }))
    },
    match: {
      findUnique: vi.fn(async () => ({
        id: "match-1",
        matchNumber: 1,
        groupId: null,
        startsAt: new Date("2026-06-11T19:00:00.000Z"),
        homeTeamId: "team-home",
        awayTeamId: "team-away",
        homeScore: 2,
        awayScore: 1,
        winnerTeamId: "team-home",
        stage: { code: "GROUP_STAGE", isKnockout: false }
      })),
      findMany: vi.fn(async () => [])
    },
    prediction: {
      findUnique: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...prediction,
          pool: { scoreRule: null },
          match: {
            id: "match-1",
            matchNumber: 1,
            groupId: null,
            startsAt: new Date("2026-06-11T19:00:00.000Z"),
            homeTeamId: "team-home",
            awayTeamId: "team-away",
            homeScore: 2,
            awayScore: 1,
            winnerTeamId: "team-home",
            stage: { code: "GROUP_STAGE", isKnockout: false }
          }
        }),
      create: vi.fn(async ({ data }) => ({ id: "prediction-1", ...data })),
      update: vi.fn()
    },
    predictionHistory: {
      create: vi.fn(async () => ({}))
    },
    pointsHistory: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
      create: vi.fn(async ({ data }) => ({ id: "points-1", ...data })),
      findMany: vi.fn(async () => [
        {
          poolId: "pool-1",
          userId: "user-1",
          totalPoints: 5,
          exactScorePoints: 2,
          resultPoints: 3,
          prediction: { createdAt: new Date("2026-06-10T10:00:00.000Z") }
        }
      ])
    },
    rankingSnapshot: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
      createMany: vi.fn(async () => ({ count: 1 }))
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    }
  };
}

describe("upsertRetroactivePredictionInTransaction", () => {
  it("allows an admin operation to create a past prediction, points and audit", async () => {
    const client = createClientMock();

    const result = await upsertRetroactivePredictionInTransaction(
      client as never,
      {
        adminUserId: "admin-1",
        poolId: "pool-1",
        userId: "user-1",
        matchId: "match-1",
        homeScore: 2,
        awayScore: 1,
        predictedWinnerTeamId: null
      }
    );

    expect(result.prediction.id).toBe("prediction-1");
    expect(result.pointsHistory).toEqual(
      expect.objectContaining({
        id: "points-1",
        totalPoints: 5,
        exactScorePoints: 2,
        resultPoints: 3
      })
    );
    expect(client.predictionHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changedByUserId: "admin-1",
          predictionId: "prediction-1"
        })
      })
    );
    expect(client.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "PREDICTION_RETROACTIVE_UPSERT",
          userId: "admin-1",
          metadata: expect.objectContaining({
            affectedUserId: "user-1",
            pointsCalculated: true
          })
        })
      })
    );
  });
});
