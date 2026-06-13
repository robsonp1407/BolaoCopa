import { describe, expect, it, vi } from "vitest";

import { PredictionServiceError } from "./errors";
import { upsertPrediction } from "./upsert-prediction";

const openMatch = {
  id: "match-1",
  startsAt: new Date("2026-06-11T19:00:00.000Z"),
  homeTeamId: "team-home",
  awayTeamId: "team-away",
  stage: { isKnockout: false }
};

const validPrediction = {
  homeScore: 2,
  awayScore: 1,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  predictedWinnerTeamId: null
};

function createClientMock(options?: {
  existingPrediction?: Record<string, unknown> | null;
  startsAt?: Date;
  members?: { userId: string; role: string }[];
  tournamentId?: string | null;
}) {
  const existingPrediction = options?.existingPrediction ?? null;
  const prediction = {
    id: existingPrediction?.id ?? "prediction-1",
    poolId: "pool-1",
    userId: "user-1",
    matchId: "match-1",
    ...validPrediction
  };

  return {
    pool: {
      findUnique: vi.fn(async () => ({
        id: "pool-1",
        status: "ACTIVE",
        tournamentId: options?.tournamentId ?? null,
        members: options?.members ?? [{ userId: "user-1", role: "MEMBER" }]
      }))
    },
    match: {
      findUnique: vi.fn(async () => ({
        ...openMatch,
        startsAt: options?.startsAt ?? openMatch.startsAt
      }))
    },
    prediction: {
      findUnique: vi.fn(async () => existingPrediction),
      create: vi.fn(async ({ data }) => ({ id: "prediction-1", ...data })),
      update: vi.fn(async ({ data }) => ({ ...prediction, ...data }))
    },
    predictionHistory: {
      create: vi.fn(async () => ({}))
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    }
  };
}

describe("upsertPrediction", () => {
  it("creates a prediction before match start", async () => {
    const client = createClientMock();

    const prediction = await upsertPrediction(client as never, {
      poolId: "pool-1",
      userId: "user-1",
      matchId: "match-1",
      data: validPrediction,
      now: new Date("2026-06-11T18:00:00.000Z")
    });

    expect(prediction).toEqual(expect.objectContaining({ id: "prediction-1" }));
    expect(client.prediction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          poolId: "pool-1",
          userId: "user-1",
          matchId: "match-1",
          homeScore: 2,
          awayScore: 1
        })
      })
    );
    expect(client.predictionHistory.create).not.toHaveBeenCalled();
    expect(client.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PREDICTION_CREATED" })
      })
    );
  });

  it("updates a prediction and stores previous state in history", async () => {
    const client = createClientMock({
      existingPrediction: {
        id: "prediction-1",
        poolId: "pool-1",
        userId: "user-1",
        matchId: "match-1",
        homeScore: 1,
        awayScore: 0,
        homePenaltyScore: null,
        awayPenaltyScore: null,
        predictedWinnerTeamId: null
      }
    });

    await upsertPrediction(client as never, {
      poolId: "pool-1",
      userId: "user-1",
      matchId: "match-1",
      data: validPrediction,
      now: new Date("2026-06-11T18:00:00.000Z")
    });

    expect(client.predictionHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          predictionId: "prediction-1",
          previousHomeScore: 1,
          previousAwayScore: 0,
          changedByUserId: "user-1"
        })
      })
    );
    expect(client.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PREDICTION_UPDATED" })
      })
    );
  });

  it("blocks prediction after match start and audits the attempt", async () => {
    const client = createClientMock({
      existingPrediction: {
        id: "prediction-1",
        lockedAt: null,
        poolId: "pool-1",
        userId: "user-1",
        matchId: "match-1",
        ...validPrediction
      }
    });

    await expect(
      upsertPrediction(client as never, {
        poolId: "pool-1",
        userId: "user-1",
        matchId: "match-1",
        data: validPrediction,
        now: new Date("2026-06-11T19:00:00.000Z")
      })
    ).rejects.toThrow(PredictionServiceError);

    expect(client.prediction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prediction-1" },
        data: expect.objectContaining({ lockedAt: expect.any(Date) })
      })
    );
    expect(client.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PREDICTION_LOCKED_ATTEMPT" })
      })
    );
  });

  it("rejects users outside the pool", async () => {
    const client = createClientMock({ members: [] });

    await expect(
      upsertPrediction(client as never, {
        poolId: "pool-1",
        userId: "user-1",
        matchId: "match-1",
        data: validPrediction,
        now: new Date("2026-06-11T18:00:00.000Z")
      })
    ).rejects.toMatchObject({ code: "POOL_MEMBERSHIP_REQUIRED" });
  });

  it("rejects matches outside the pool tournament", async () => {
    const client = createClientMock({ tournamentId: "another-tournament" });

    await expect(
      upsertPrediction(client as never, {
        poolId: "pool-1",
        userId: "user-1",
        matchId: "match-1",
        data: validPrediction,
        now: new Date("2026-06-11T18:00:00.000Z")
      })
    ).rejects.toMatchObject({ code: "MATCH_OUTSIDE_POOL_TOURNAMENT" });
  });
});
