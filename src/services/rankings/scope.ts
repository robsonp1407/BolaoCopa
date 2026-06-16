import type { RankingScope } from "@prisma/client";

export const GENERAL_SCOPE_KEY = "ALL";

export type MatchForRankingScope = {
  id: string;
  matchNumber: number;
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  startsAt: Date | null;
  stage: {
    code: string;
    isKnockout: boolean;
  };
};

export function getMatchRankingScopes(
  match: MatchForRankingScope,
  groupMatches: MatchForRankingScope[] = []
) {
  const scopes: { scope: RankingScope; scopeKey: string }[] = [
    { scope: "GENERAL", scopeKey: GENERAL_SCOPE_KEY }
  ];

  if (match.stage.isKnockout) {
    scopes.push({ scope: "KNOCKOUT_STAGE", scopeKey: match.stage.code });
    return scopes;
  }

  const groupRound = getGroupRound(match, groupMatches);

  if (groupRound !== null) {
    scopes.push({ scope: "GROUP_ROUND", scopeKey: `ROUND_${groupRound}` });
  }

  return scopes;
}

export function getGroupRound(
  match: MatchForRankingScope,
  groupMatches: MatchForRankingScope[]
) {
  if (!match.groupId) {
    return null;
  }

  const orderedGroupMatches = groupMatches
    .filter((candidate) => candidate.groupId === match.groupId)
    .sort((a, b) => {
      const startsAtDiff =
        (a.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER);

      return startsAtDiff || a.matchNumber - b.matchNumber;
    });

  const teamRounds = new Map<string, number>();

  for (const candidate of orderedGroupMatches) {
    const teams = [candidate.homeTeamId, candidate.awayTeamId].filter(
      Boolean
    ) as string[];
    const nextRound =
      Math.max(...teams.map((teamId) => teamRounds.get(teamId) ?? 0), 0) + 1;

    for (const teamId of teams) {
      teamRounds.set(teamId, nextRound);
    }

    if (candidate.id === match.id) {
      return nextRound;
    }
  }

  return null;
}
