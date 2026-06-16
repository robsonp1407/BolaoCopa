import { describe, expect, it } from "vitest";

import { rankEntries } from "./rank-entries";

describe("rankEntries", () => {
  it("orders by total points, exact hits, result hits and earliest prediction", () => {
    const ranked = rankEntries([
      {
        poolId: "pool-1",
        userId: "late-user",
        totalPoints: 10,
        exactScoreHits: 2,
        resultHits: 3,
        earliestPrediction: new Date("2026-06-11T12:00:00.000Z")
      },
      {
        poolId: "pool-1",
        userId: "winner",
        totalPoints: 10,
        exactScoreHits: 3,
        resultHits: 1,
        earliestPrediction: new Date("2026-06-11T13:00:00.000Z")
      },
      {
        poolId: "pool-1",
        userId: "early-user",
        totalPoints: 10,
        exactScoreHits: 2,
        resultHits: 3,
        earliestPrediction: new Date("2026-06-11T10:00:00.000Z")
      },
      {
        poolId: "pool-1",
        userId: "low-score",
        totalPoints: 9,
        exactScoreHits: 9,
        resultHits: 9,
        earliestPrediction: new Date("2026-06-11T09:00:00.000Z")
      }
    ]);

    expect(ranked.map((entry) => [entry.position, entry.userId])).toEqual([
      [1, "winner"],
      [2, "early-user"],
      [3, "late-user"],
      [4, "low-score"]
    ]);
  });
});
