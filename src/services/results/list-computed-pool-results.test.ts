import { describe, expect, it, vi } from "vitest";

import { PoolServiceError } from "@/services/pools/errors";

import { listComputedPoolResults } from "./list-computed-pool-results";

describe("listComputedPoolResults", () => {
  it("blocks users that are not pool members", async () => {
    const prisma = {
      pool: {
        findUnique: vi.fn(async () => ({
          id: "pool-1",
          name: "Bolao teste",
          status: "ACTIVE",
          members: []
        }))
      }
    };

    await expect(
      listComputedPoolResults(prisma as never, {
        poolId: "pool-1",
        userId: "user-1"
      })
    ).rejects.toMatchObject(
      new PoolServiceError(
        "Voce precisa participar deste bolao para ver os resultados",
        403,
        "POOL_MEMBERSHIP_REQUIRED"
      )
    );
  });

  it("returns only official matches with computed points aggregated by match", async () => {
    const firstCalculatedAt = new Date("2026-06-12T10:00:00.000Z");
    const secondCalculatedAt = new Date("2026-06-12T10:05:00.000Z");
    const thirdCalculatedAt = new Date("2026-06-13T11:00:00.000Z");
    const ignoredCalculatedAt = new Date("2026-06-14T12:00:00.000Z");
    const matchOne = {
      id: "match-1",
      matchNumber: 1,
      startsAt: new Date("2026-06-11T19:00:00.000Z"),
      homeScore: 2,
      awayScore: 0,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      homeSlot: "A1",
      awaySlot: "A2",
      stage: { name: "Fase de grupos" },
      group: { code: "A", name: "Grupo A" },
      homeTeam: { name: "Time 1", flagEmoji: "T1" },
      awayTeam: { name: "Time 2", flagEmoji: "T2" }
    };
    const matchTwo = {
      id: "match-2",
      matchNumber: 2,
      startsAt: new Date("2026-06-12T19:00:00.000Z"),
      homeScore: 1,
      awayScore: 1,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      homeSlot: "B1",
      awaySlot: "B2",
      stage: { name: "Fase de grupos" },
      group: { code: "B", name: "Grupo B" },
      homeTeam: { name: "Time 3", flagEmoji: null },
      awayTeam: { name: "Time 4", flagEmoji: null }
    };
    const matchWithoutOfficialScore = {
      ...matchTwo,
      id: "match-ignored",
      matchNumber: 3,
      homeScore: null,
      awayScore: null
    };
    const prisma = {
      pool: {
        findUnique: vi.fn(async () => ({
          id: "pool-1",
          name: "Bolao teste",
          status: "ACTIVE",
          members: [{ userId: "user-1" }]
        }))
      },
      pointsHistory: {
        findMany: vi.fn(async () => [
          {
            totalPoints: 4,
            calculatedAt: firstCalculatedAt,
            match: matchOne
          },
          {
            totalPoints: 0,
            calculatedAt: secondCalculatedAt,
            match: matchOne
          },
          {
            totalPoints: 6,
            calculatedAt: thirdCalculatedAt,
            match: matchTwo
          },
          {
            totalPoints: 6,
            calculatedAt: ignoredCalculatedAt,
            match: matchWithoutOfficialScore
          }
        ])
      }
    };

    const result = await listComputedPoolResults(prisma as never, {
      poolId: "pool-1",
      userId: "user-1"
    });

    expect(prisma.pointsHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          poolId: "pool-1",
          match: {
            homeScore: { not: null },
            awayScore: { not: null }
          }
        }
      })
    );
    expect(result.summary).toEqual({
      computedMatches: 2,
      computedPredictions: 3,
      distributedPoints: 10
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        match: expect.objectContaining({
          id: "match-1",
          homeScore: 2,
          awayScore: 0
        }),
        computedPredictions: 2,
        distributedPoints: 4,
        lastCalculatedAt: secondCalculatedAt
      }),
      expect.objectContaining({
        match: expect.objectContaining({
          id: "match-2",
          homeScore: 1,
          awayScore: 1
        }),
        computedPredictions: 1,
        distributedPoints: 6,
        lastCalculatedAt: thirdCalculatedAt
      })
    ]);
  });
});
