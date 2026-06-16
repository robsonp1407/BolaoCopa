import { describe, expect, it, vi } from "vitest";

import { quickSavePredictions } from "./quick-save-predictions";

const match = {
  id: "match-1",
  startsAt: new Date("2026-06-11T19:00:00.000Z"),
  homeTeamId: "team-home",
  awayTeamId: "team-away",
  stage: { isKnockout: false }
};

const payload = {
  predictions: [
    {
      matchId: "match-1",
      homeScore: 1,
      awayScore: 0,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      predictedWinnerTeamId: null
    }
  ]
};

function createQuickClient(startsAt = match.startsAt) {
  const tx = createModelMocks(startsAt);

  return {
    ...createModelMocks(startsAt),
    $transaction: vi.fn(async (callback) => callback(tx)),
    tx
  };
}

function createModelMocks(startsAt: Date) {
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
      findUnique: vi.fn(async () => ({ ...match, startsAt }))
    },
    prediction: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }) => ({ id: "prediction-1", ...data })),
      update: vi.fn(async ({ data }) => ({ id: "prediction-1", ...data }))
    },
    predictionHistory: {
      create: vi.fn(async () => ({}))
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    }
  };
}

describe("quickSavePredictions", () => {
  it("rejects duplicated match ids before starting transaction", async () => {
    const client = createQuickClient();

    await expect(
      quickSavePredictions(client as never, {
        poolId: "pool-1",
        userId: "user-1",
        data: {
          predictions: [payload.predictions[0], payload.predictions[0]]
        },
        now: new Date("2026-06-11T18:00:00.000Z")
      })
    ).rejects.toMatchObject({
      code: "PREDICTION_BATCH_DUPLICATED_MATCH",
      details: { duplicatedMatchIds: ["match-1"] }
    });

    expect(client.$transaction).not.toHaveBeenCalled();
  });

  it("saves multiple predictions in a transaction", async () => {
    const client = createQuickClient();

    const predictions = await quickSavePredictions(client as never, {
      poolId: "pool-1",
      userId: "user-1",
      data: payload,
      now: new Date("2026-06-11T18:00:00.000Z")
    });

    expect(predictions).toHaveLength(1);
    expect(client.$transaction).toHaveBeenCalledOnce();
    expect(client.tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PREDICTION_QUICK_SAVE" })
      })
    );
  });

  it("does not save partially when any prediction is blocked", async () => {
    const client = createQuickClient(new Date("2026-06-11T18:00:00.000Z"));

    await expect(
      quickSavePredictions(client as never, {
        poolId: "pool-1",
        userId: "user-1",
        data: payload,
        now: new Date("2026-06-11T18:00:00.000Z")
      })
    ).rejects.toMatchObject({
      code: "PREDICTION_BATCH_LOCKED",
      details: { blockedMatchIds: ["match-1"] }
    });

    expect(client.$transaction).not.toHaveBeenCalled();
    expect(client.prediction.create).not.toHaveBeenCalled();
    expect(client.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PREDICTION_LOCKED_ATTEMPT" })
      })
    );
  });
});
