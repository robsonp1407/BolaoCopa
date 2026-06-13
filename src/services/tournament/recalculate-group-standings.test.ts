import { describe, expect, it } from "vitest";

import {
  calculateGroupStandings,
  determineBestThirdPlaceTeams
} from "./recalculate-group-standings";
import type { GroupMatchInput, StandingRow, TeamRef } from "./types";

const teams: TeamRef[] = [
  { id: "bra", name: "Brasil", groupId: "group-c", groupCode: "C" },
  { id: "mar", name: "Marrocos", groupId: "group-c", groupCode: "C" },
  { id: "hai", name: "Haiti", groupId: "group-c", groupCode: "C" },
  { id: "sco", name: "Escocia", groupId: "group-c", groupCode: "C" }
];

function match(
  homeTeam: TeamRef,
  awayTeam: TeamRef,
  homeScore: number,
  awayScore: number
): GroupMatchInput {
  return {
    groupId: "group-c",
    groupCode: "C",
    homeTeam,
    awayTeam,
    homeScore,
    awayScore
  };
}

describe("calculateGroupStandings", () => {
  it("calculates group standings with points and goal criteria", () => {
    const result = calculateGroupStandings(teams, [
      match(teams[0], teams[1], 2, 0),
      match(teams[2], teams[3], 1, 1),
      match(teams[0], teams[2], 3, 1),
      match(teams[1], teams[3], 2, 1)
    ]);

    expect(result.standings.map((row) => [row.qualifier, row.points])).toEqual([
      ["1C", 6],
      ["2C", 3],
      ["3C", 1],
      ["4C", 1]
    ]);
    expect(result.standings[0]).toMatchObject({
      played: 2,
      wins: 2,
      goalsFor: 5,
      goalsAgainst: 1,
      goalDifference: 4
    });
  });

  it("changes standings when a result is reprocessed", () => {
    const original = calculateGroupStandings(teams, [
      match(teams[0], teams[1], 2, 0),
      match(teams[0], teams[2], 3, 1)
    ]);
    const changed = calculateGroupStandings(teams, [
      match(teams[0], teams[1], 0, 2),
      match(teams[0], teams[2], 0, 1)
    ]);

    expect(original.standings[0]?.teamId).toBe("bra");
    expect(changed.standings[0]?.teamId).toBe("mar");
  });
});

describe("determineBestThirdPlaceTeams", () => {
  it("selects the eight best third-placed teams", () => {
    const standings: StandingRow[] = Array.from({ length: 12 }, (_, index) => ({
      groupId: `group-${index}`,
      groupCode: String.fromCharCode(65 + index),
      teamId: `team-${index}`,
      teamName: `Team ${String.fromCharCode(65 + index)}`,
      played: 3,
      wins: 1,
      draws: 0,
      losses: 2,
      goalsFor: 3 + index,
      goalsAgainst: 3,
      goalDifference: index,
      points: index % 2 === 0 ? 4 : 3,
      position: 3,
      qualifier: `3${String.fromCharCode(65 + index)}`,
      isQualified: false
    }));

    const bestThirds = determineBestThirdPlaceTeams(standings);

    expect(bestThirds).toHaveLength(8);
    expect(bestThirds[0]?.groupCode).toBe("K");
    expect(bestThirds.every((row) => row.position === 3)).toBe(true);
  });
});
