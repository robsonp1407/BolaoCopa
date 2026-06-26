import { describe, expect, it, vi } from "vitest";

import { getPoolRanking } from "./get-ranking";

describe("getPoolRanking", () => {
  it("returns ranking snapshots with display-only prediction metrics", async () => {
    const prisma = {
      pool: {
        findUnique: vi.fn(async () => ({
          id: "pool-1",
          name: "Bolao teste",
          status: "ACTIVE",
          members: [{ userId: "viewer-1" }]
        }))
      },
      match: {
        findMany: vi.fn(async () => [
          { id: "match-1", stage: { code: "GROUP_STAGE", isKnockout: false } },
          { id: "match-2", stage: { code: "GROUP_STAGE", isKnockout: false } },
          { id: "match-3", stage: { code: "FINAL", isKnockout: true } }
        ])
      },
      rankingSnapshot: {
        count: vi.fn(async () => 1),
        findMany: vi.fn(async () => [
          {
            id: "snapshot-1",
            poolId: "pool-1",
            userId: "user-1",
            scope: "GENERAL",
            scopeKey: "ALL",
            position: 1,
            totalPoints: 12,
            exactScoreHits: 2,
            resultHits: 3,
            firstPredictionAt: new Date("2026-06-11T10:00:00.000Z"),
            createdAt: new Date("2026-06-12T10:00:00.000Z"),
            updatedAt: new Date("2026-06-12T10:00:00.000Z"),
            matchId: null,
            user: {
              id: "user-1",
              name: "Participante",
              email: "participante@example.com",
              image: null
            }
          }
        ])
      },
      pointsHistory: {
        findMany: vi.fn(async () => [
          {
            userId: "user-1",
            singleTeamScorePoints: 1,
            totalPoints: 4
          },
          {
            userId: "user-1",
            singleTeamScorePoints: 0,
            totalPoints: 0
          },
          {
            userId: "user-1",
            singleTeamScorePoints: 0,
            totalPoints: 5
          }
        ])
      },
      prediction: {
        count: vi.fn(async () => 3)
      }
    };

    const result = await getPoolRanking(prisma as never, {
      poolId: "pool-1",
      userId: "viewer-1",
      scope: "GENERAL",
      scopeKey: "ALL",
      page: 1,
      pageSize: 50
    });

    expect(result.scopeStats).toEqual({
      totalMatches: 3,
      totalPredictions: 3
    });
    expect(result.ranking[0]).toMatchObject({
      userId: "user-1",
      position: 1,
      totalPoints: 12,
      predictionStats: {
        predictionsCount: 3,
        singleTeamScoreHits: 1,
        noPointPredictions: 1
      }
    });
    expect(prisma.rankingSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { position: "asc" },
        skip: 0,
        take: 50
      })
    );
  });
});
