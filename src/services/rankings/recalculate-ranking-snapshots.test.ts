import { describe, expect, it, vi } from "vitest";

import { recalculateRankingSnapshotsForPoolInTransaction } from "./recalculate-ranking-snapshots";

describe("recalculateRankingSnapshotsForPoolInTransaction", () => {
  it("rebuilds snapshots for a pool and scope with tie-breakers", async () => {
    const tx = {
      rankingSnapshot: {
        deleteMany: vi.fn(async () => ({ count: 2 })),
        createMany: vi.fn(async () => ({ count: 2 }))
      },
      pointsHistory: {
        findMany: vi.fn(async () => [
          {
            poolId: "pool-1",
            userId: "user-1",
            totalPoints: 5,
            exactScorePoints: 2,
            resultPoints: 3,
            prediction: { createdAt: new Date("2026-06-11T10:00:00.000Z") }
          },
          {
            poolId: "pool-1",
            userId: "user-2",
            totalPoints: 5,
            exactScorePoints: 0,
            resultPoints: 3,
            prediction: { createdAt: new Date("2026-06-11T09:00:00.000Z") }
          }
        ])
      }
    };

    const summary = await recalculateRankingSnapshotsForPoolInTransaction(
      tx as never,
      {
        poolId: "pool-1",
        scopes: [{ scope: "GENERAL", scopeKey: "ALL" }]
      }
    );

    expect(summary).toEqual({
      poolId: "pool-1",
      scopes: [{ scope: "GENERAL", scopeKey: "ALL" }],
      createdSnapshots: 2,
      deletedSnapshots: 2
    });
    expect(tx.rankingSnapshot.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: "user-1",
          position: 1,
          totalPoints: 5,
          exactScoreHits: 1,
          resultHits: 1
        }),
        expect.objectContaining({
          userId: "user-2",
          position: 2,
          totalPoints: 5,
          exactScoreHits: 0,
          resultHits: 1
        })
      ]
    });
  });
});
