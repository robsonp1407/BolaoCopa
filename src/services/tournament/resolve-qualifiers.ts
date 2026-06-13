import type { StandingRow, TeamRef } from "./types";

export type MatchLookup = {
  matchNumber: number;
  winnerTeamId: string | null;
  loserTeamId: string | null;
};

export type QualifierContext = {
  standings: StandingRow[];
  bestThirdPlaceTeams: StandingRow[];
  teamsById: Map<string, TeamRef>;
  matches: MatchLookup[];
};

export function resolveQualifier(
  qualifier: string | null | undefined,
  context: QualifierContext
): TeamRef | null {
  if (!qualifier) {
    return null;
  }

  const normalizedQualifier = qualifier.trim().toUpperCase();
  const groupPosition = normalizedQualifier.match(/^([123])([A-Z])$/);
  if (groupPosition) {
    const [, position, groupCode] = groupPosition;
    const standing = context.standings.find(
      (row) =>
        row.position === Number(position) &&
        row.groupCode === groupCode &&
        (row.position <= 2 || row.isQualified)
    );

    return standing ? context.teamsById.get(standing.teamId) ?? null : null;
  }

  const candidateThird = normalizedQualifier.match(/^3([A-Z](?:\/[A-Z])+)$/);
  if (candidateThird) {
    const candidates = new Set(candidateThird[1].split("/"));
    const standing = context.bestThirdPlaceTeams.find((row) =>
      candidates.has(row.groupCode)
    );

    return standing ? context.teamsById.get(standing.teamId) ?? null : null;
  }

  const matchResult = normalizedQualifier.match(/^([WL])(\d+)$/);
  if (matchResult) {
    const [, resultType, matchNumber] = matchResult;
    const match = context.matches.find(
      (candidate) => candidate.matchNumber === Number(matchNumber)
    );
    const teamId = resultType === "W" ? match?.winnerTeamId : match?.loserTeamId;

    return teamId ? context.teamsById.get(teamId) ?? null : null;
  }

  return null;
}
