import { describe, expect, it } from "vitest";

import { predictionPayloadSchema } from "./prediction";

describe("predictionPayloadSchema", () => {
  it("rejects negative scores", () => {
    const parsed = predictionPayloadSchema.safeParse({
      homeScore: -1,
      awayScore: 0,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      predictedWinnerTeamId: null
    });

    expect(parsed.success).toBe(false);
  });

  it("normalizes omitted optional fields to null", () => {
    const parsed = predictionPayloadSchema.parse({
      homeScore: 2,
      awayScore: 1
    });

    expect(parsed).toEqual({
      homeScore: 2,
      awayScore: 1,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      predictedWinnerTeamId: null
    });
  });
});
