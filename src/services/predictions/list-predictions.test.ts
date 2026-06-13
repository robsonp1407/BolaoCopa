import { describe, expect, it, vi } from "vitest";

import { listPredictions } from "./list-predictions";

describe("listPredictions", () => {
  it("returns pending summary for available, filled and locked games", async () => {
    const client = {
      pool: {
        findUnique: vi.fn(async () => ({
          id: "pool-1",
          name: "Bolao Teste",
          status: "ACTIVE",
          tournamentId: null,
          members: [{ userId: "user-1" }]
        }))
      },
      match: {
        findMany: vi.fn(async () => [
          {
            id: "match-open-filled",
            matchNumber: 1,
            startsAt: new Date("2026-06-11T19:00:00.000Z"),
            stage: { name: "Grupos", isKnockout: false },
            group: { code: "A", name: "Grupo A" },
            stadium: null,
            homeTeam: null,
            awayTeam: null
          },
          {
            id: "match-open-pending",
            matchNumber: 2,
            startsAt: new Date("2026-06-11T20:00:00.000Z"),
            stage: { name: "Grupos", isKnockout: false },
            group: { code: "A", name: "Grupo A" },
            stadium: null,
            homeTeam: null,
            awayTeam: null
          },
          {
            id: "match-locked",
            matchNumber: 3,
            startsAt: new Date("2026-06-11T17:00:00.000Z"),
            stage: { name: "Grupos", isKnockout: false },
            group: { code: "A", name: "Grupo A" },
            stadium: null,
            homeTeam: null,
            awayTeam: null
          }
        ])
      },
      prediction: {
        findMany: vi.fn(async () => [
          {
            id: "prediction-1",
            matchId: "match-open-filled",
            poolId: "pool-1",
            userId: "user-1",
            homeScore: 1,
            awayScore: 0,
            homePenaltyScore: null,
            awayPenaltyScore: null,
            predictedWinnerTeamId: null
          }
        ])
      }
    };

    const result = await listPredictions(client as never, {
      poolId: "pool-1",
      userId: "user-1",
      now: new Date("2026-06-11T18:00:00.000Z")
    });

    expect(result.summary).toEqual({
      totalGames: 3,
      totalAvailable: 2,
      totalFilled: 1,
      totalPending: 1,
      totalLocked: 1
    });
    expect(result.items.map((item) => item.isPending)).toEqual([
      false,
      true,
      false
    ]);
  });
});
