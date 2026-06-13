import { describe, expect, it } from "vitest";

import { advanceBracket } from "./advance-bracket";
import type { StandingRow } from "./types";

describe("advanceBracket", () => {
  it("fills next matches from qualifiers", () => {
    const standings: StandingRow[] = [
      row("A", 1, "team-a1", "A1", true),
      row("B", 2, "team-b2", "B2", true)
    ];
    const updates = advanceBracket(
      [
        {
          id: "match-73",
          matchNumber: 73,
          homeQualifier: "1A",
          awayQualifier: "2B",
          homeTeamId: null,
          awayTeamId: null
        },
        {
          id: "match-89",
          matchNumber: 89,
          homeQualifier: "W73",
          awayQualifier: null,
          homeTeamId: null,
          awayTeamId: null
        }
      ],
      {
        standings,
        bestThirdPlaceTeams: [],
        teamsById: new Map([
          ["team-a1", { id: "team-a1", name: "A1" }],
          ["team-b2", { id: "team-b2", name: "B2" }]
        ]),
        matches: [{ matchNumber: 73, winnerTeamId: "team-a1", loserTeamId: "team-b2" }]
      }
    );

    expect(updates).toEqual([
      { id: "match-73", homeTeamId: "team-a1", awayTeamId: "team-b2" },
      { id: "match-89", homeTeamId: "team-a1", awayTeamId: null }
    ]);
  });
});

function row(
  groupCode: string,
  position: number,
  teamId: string,
  teamName: string,
  isQualified: boolean
): StandingRow {
  return {
    groupId: `group-${groupCode}`,
    groupCode,
    teamId,
    teamName,
    played: 3,
    wins: 2,
    draws: 0,
    losses: 1,
    goalsFor: 5,
    goalsAgainst: 3,
    goalDifference: 2,
    points: 6,
    position,
    qualifier: `${position}${groupCode}`,
    isQualified
  };
}
