import { describe, expect, it } from "vitest";

import { calculateMatchWinner } from "./calculate-match-winner";

const homeTeam = { id: "team-home", name: "Home" };
const awayTeam = { id: "team-away", name: "Away" };

describe("calculateMatchWinner", () => {
  it("determines winner and loser from regular time", () => {
    expect(
      calculateMatchWinner({
        homeTeam,
        awayTeam,
        homeScore: 2,
        awayScore: 1,
        isKnockout: false
      })
    ).toEqual({ winnerTeamId: "team-home", loserTeamId: "team-away" });
  });

  it("keeps group stage draws without winner", () => {
    expect(
      calculateMatchWinner({
        homeTeam,
        awayTeam,
        homeScore: 1,
        awayScore: 1,
        isKnockout: false
      })
    ).toEqual({ winnerTeamId: null, loserTeamId: null });
  });

  it("uses penalties for knockout draws", () => {
    expect(
      calculateMatchWinner({
        homeTeam,
        awayTeam,
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 5,
        isKnockout: true
      })
    ).toEqual({ winnerTeamId: "team-away", loserTeamId: "team-home" });
  });
});
