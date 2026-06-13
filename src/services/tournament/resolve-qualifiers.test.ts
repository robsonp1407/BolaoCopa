import { describe, expect, it } from "vitest";

import { resolveQualifier } from "./resolve-qualifiers";
import type { StandingRow } from "./types";

const standings: StandingRow[] = [
  standing("A", 1, "mex", "Mexico", true, 7),
  standing("A", 2, "kor", "Coreia do Sul", true, 5),
  standing("A", 3, "rsa", "Africa do Sul", false, 4),
  standing("B", 3, "can", "Canada", true, 5),
  standing("C", 3, "bra", "Brasil", true, 6)
];
const teamsById = new Map(
  standings.map((row) => [
    row.teamId,
    { id: row.teamId, name: row.teamName, groupCode: row.groupCode }
  ])
);
const context = {
  standings,
  bestThirdPlaceTeams: [standings[4], standings[3]],
  teamsById,
  matches: [
    { matchNumber: 73, winnerTeamId: "mex", loserTeamId: "kor" },
    { matchNumber: 101, winnerTeamId: "mex", loserTeamId: "can" }
  ]
};

describe("resolveQualifier", () => {
  it("resolves group position qualifiers", () => {
    expect(resolveQualifier("1A", context)?.id).toBe("mex");
    expect(resolveQualifier("2A", context)?.id).toBe("kor");
  });

  it("resolves candidate best-third qualifiers by best ranking", () => {
    expect(resolveQualifier("3A/B/C", context)?.id).toBe("bra");
  });

  it("does not resolve non-qualified third place teams", () => {
    expect(resolveQualifier("3A", context)).toBeNull();
  });

  it("resolves winner and loser qualifiers", () => {
    expect(resolveQualifier("W73", context)?.id).toBe("mex");
    expect(resolveQualifier("L101", context)?.id).toBe("can");
  });
});

function standing(
  groupCode: string,
  position: number,
  teamId: string,
  teamName: string,
  isQualified: boolean,
  points: number
): StandingRow {
  return {
    groupId: `group-${groupCode}`,
    groupCode,
    teamId,
    teamName,
    played: 3,
    wins: 1,
    draws: 0,
    losses: 2,
    goalsFor: points,
    goalsAgainst: 3,
    goalDifference: points - 3,
    points,
    position,
    qualifier: `${position}${groupCode}`,
    isQualified
  };
}
