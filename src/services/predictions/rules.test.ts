import { describe, expect, it } from "vitest";

import { PredictionServiceError } from "./errors";
import { validatePredictionAgainstMatch } from "./rules";

const basePrediction = {
  homeScore: 1,
  awayScore: 1,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  predictedWinnerTeamId: null
};

describe("validatePredictionAgainstMatch", () => {
  it("allows draws in group stage without predicted winner", () => {
    expect(() =>
      validatePredictionAgainstMatch(basePrediction, {
        id: "match-1",
        homeTeamId: "team-home",
        awayTeamId: "team-away",
        stage: { isKnockout: false }
      })
    ).not.toThrow();
  });

  it("requires predicted winner for tied knockout matches", () => {
    expect(() =>
      validatePredictionAgainstMatch(basePrediction, {
        id: "match-2",
        homeTeamId: "team-home",
        awayTeamId: "team-away",
        stage: { isKnockout: true }
      })
    ).toThrow(PredictionServiceError);
  });

  it("rejects predicted winner outside match teams when teams are known", () => {
    expect(() =>
      validatePredictionAgainstMatch(
        { ...basePrediction, predictedWinnerTeamId: "other-team" },
        {
          id: "match-3",
          homeTeamId: "team-home",
          awayTeamId: "team-away",
          stage: { isKnockout: true }
        }
      )
    ).toThrow("O vencedor previsto precisa ser uma das selecoes da partida");
  });
});
