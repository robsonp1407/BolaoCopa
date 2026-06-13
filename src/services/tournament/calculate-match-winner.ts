import type { MatchResultInput, TeamRef } from "./types";

export type MatchWinnerInput = MatchResultInput & {
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  isKnockout: boolean;
};

export type MatchWinnerResult = {
  winnerTeamId: string | null;
  loserTeamId: string | null;
};

export function calculateMatchWinner(input: MatchWinnerInput): MatchWinnerResult {
  if (
    !input.homeTeam ||
    !input.awayTeam ||
    input.homeScore === null ||
    input.awayScore === null
  ) {
    return { winnerTeamId: null, loserTeamId: null };
  }

  if (input.homeScore > input.awayScore) {
    return { winnerTeamId: input.homeTeam.id, loserTeamId: input.awayTeam.id };
  }

  if (input.awayScore > input.homeScore) {
    return { winnerTeamId: input.awayTeam.id, loserTeamId: input.homeTeam.id };
  }

  if (!input.isKnockout) {
    return { winnerTeamId: null, loserTeamId: null };
  }

  if (
    input.homePenaltyScore === null ||
    input.homePenaltyScore === undefined ||
    input.awayPenaltyScore === null ||
    input.awayPenaltyScore === undefined ||
    input.homePenaltyScore === input.awayPenaltyScore
  ) {
    return { winnerTeamId: null, loserTeamId: null };
  }

  return input.homePenaltyScore > input.awayPenaltyScore
    ? { winnerTeamId: input.homeTeam.id, loserTeamId: input.awayTeam.id }
    : { winnerTeamId: input.awayTeam.id, loserTeamId: input.homeTeam.id };
}
