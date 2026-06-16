import { describe, expect, it } from "vitest";

import { calculatePredictionPoints } from "./calculate-prediction-points";

const groupMatch = {
  homeScore: 2,
  awayScore: 1,
  homeTeamId: "home-team",
  awayTeamId: "away-team",
  winnerTeamId: "home-team",
  stage: { isKnockout: false }
};

describe("calculatePredictionPoints", () => {
  it("scores exact group-stage prediction", () => {
    const points = calculatePredictionPoints(
      {
        homeScore: 2,
        awayScore: 1,
        predictedWinnerTeamId: null
      },
      groupMatch
    );

    expect(points).toEqual({
      resultPoints: 3,
      exactScorePoints: 2,
      knockoutWinnerPoints: 0,
      singleTeamScorePoints: 0,
      totalPoints: 5
    });
  });

  it("scores correct result without exact score", () => {
    const points = calculatePredictionPoints(
      {
        homeScore: 3,
        awayScore: 1,
        predictedWinnerTeamId: null
      },
      groupMatch
    );

    expect(points).toMatchObject({
      resultPoints: 3,
      exactScorePoints: 0,
      singleTeamScorePoints: 1,
      totalPoints: 4
    });
  });

  it("scores one exact team score even with wrong winner", () => {
    const points = calculatePredictionPoints(
      {
        homeScore: 2,
        awayScore: 3,
        predictedWinnerTeamId: null
      },
      groupMatch
    );

    expect(points).toMatchObject({
      resultPoints: 0,
      exactScorePoints: 0,
      singleTeamScorePoints: 1,
      totalPoints: 1
    });
  });

  it("scores draw result correctly", () => {
    const points = calculatePredictionPoints(
      {
        homeScore: 1,
        awayScore: 1,
        predictedWinnerTeamId: null
      },
      {
        ...groupMatch,
        homeScore: 2,
        awayScore: 2,
        winnerTeamId: null
      }
    );

    expect(points).toMatchObject({
      resultPoints: 3,
      exactScorePoints: 0,
      singleTeamScorePoints: 0,
      totalPoints: 3
    });
  });

  it("scores knockout exact draw and winner with maximum 6 points", () => {
    const points = calculatePredictionPoints(
      {
        homeScore: 1,
        awayScore: 1,
        predictedWinnerTeamId: "away-team"
      },
      {
        ...groupMatch,
        homeScore: 1,
        awayScore: 1,
        winnerTeamId: "away-team",
        stage: { isKnockout: true }
      }
    );

    expect(points).toEqual({
      resultPoints: 3,
      exactScorePoints: 2,
      knockoutWinnerPoints: 1,
      singleTeamScorePoints: 0,
      totalPoints: 6
    });
  });

  it("scores knockout winner bonus even when normal score is not exact", () => {
    const points = calculatePredictionPoints(
      {
        homeScore: 2,
        awayScore: 2,
        predictedWinnerTeamId: "home-team"
      },
      {
        ...groupMatch,
        homeScore: 1,
        awayScore: 1,
        winnerTeamId: "home-team",
        stage: { isKnockout: true }
      }
    );

    expect(points).toMatchObject({
      resultPoints: 3,
      exactScorePoints: 0,
      knockoutWinnerPoints: 1,
      totalPoints: 4
    });
  });

  it("returns zero when match has no official score", () => {
    const points = calculatePredictionPoints(
      {
        homeScore: 2,
        awayScore: 1,
        predictedWinnerTeamId: null
      },
      {
        ...groupMatch,
        homeScore: null,
        awayScore: null,
        winnerTeamId: null
      }
    );

    expect(points.totalPoints).toBe(0);
  });
});
