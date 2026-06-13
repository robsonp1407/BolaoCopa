import type { Prisma, PrismaClient } from "@prisma/client";

import { advanceBracket } from "./advance-bracket";
import { calculateMatchWinner } from "./calculate-match-winner";
import { calculateGroupStandings } from "./recalculate-group-standings";
import type { GroupMatchInput, StandingRow, TeamRef } from "./types";

type TransactionClient = Prisma.TransactionClient;

export type RecalculateTournamentSummary = {
  standings: number;
  bracketUpdates: number;
  matchWinners: number;
};

type MatchWithRelations = Prisma.MatchGetPayload<{
  include: {
    stage: true;
    group: true;
    homeTeam: true;
    awayTeam: true;
  };
}>;

export async function recalculateTournament(
  prisma: PrismaClient
): Promise<RecalculateTournamentSummary> {
  return prisma.$transaction(
    async (tx) => recalculateTournamentInTransaction(tx),
    {
      maxWait: 10000,
      timeout: 60000
    }
  );
}

export async function recalculateTournamentInTransaction(
  tx: TransactionClient
): Promise<RecalculateTournamentSummary> {
  const [teams, matches] = await Promise.all([
    tx.nationalTeam.findMany({
      include: { group: true },
      orderBy: [{ group: { sortOrder: "asc" } }, { name: "asc" }]
    }),
    tx.match.findMany({
      include: {
        stage: true,
        group: true,
        homeTeam: true,
        awayTeam: true
      },
      orderBy: { matchNumber: "asc" }
    })
  ]);

  const winnerUpdates = await updateMatchWinners(tx, matches);
  const refreshedMatches = applyWinnerUpdates(matches, winnerUpdates);
  const standingsResult = calculateAndPersistStandings(tx, teams, refreshedMatches);
  const standings = await standingsResult;
  const bracketUpdates = await updateBracket(tx, teams, refreshedMatches, standings);

  return {
    standings: standings.standings.length,
    bracketUpdates,
    matchWinners: winnerUpdates.length
  };
}

async function updateMatchWinners(
  tx: TransactionClient,
  matches: MatchWithRelations[]
) {
  const updates: Array<{
    id: string;
    winnerTeamId: string | null;
    loserTeamId: string | null;
  }> = [];

  for (const match of matches) {
    const winner = calculateMatchWinner({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homePenaltyScore: match.homePenaltyScore,
      awayPenaltyScore: match.awayPenaltyScore,
      isKnockout: match.stage.isKnockout
    });

    if (
      match.winnerTeamId !== winner.winnerTeamId ||
      match.loserTeamId !== winner.loserTeamId
    ) {
      updates.push({
        id: match.id,
        winnerTeamId: winner.winnerTeamId,
        loserTeamId: winner.loserTeamId
      });
      await tx.match.update({
        where: { id: match.id },
        data: winner
      });
    }
  }

  return updates;
}

function applyWinnerUpdates(
  matches: MatchWithRelations[],
  updates: Array<{ id: string; winnerTeamId: string | null; loserTeamId: string | null }>
) {
  const updatesById = new Map(updates.map((update) => [update.id, update]));

  return matches.map((match) => {
    const update = updatesById.get(match.id);

    return update
      ? {
          ...match,
          winnerTeamId: update.winnerTeamId,
          loserTeamId: update.loserTeamId
        }
      : match;
  });
}

async function calculateAndPersistStandings(
  tx: TransactionClient,
  teams: Array<Prisma.NationalTeamGetPayload<{ include: { group: true } }>>,
  matches: MatchWithRelations[]
) {
  const teamRefs: TeamRef[] = teams.map((team) => ({
    id: team.id,
    name: team.name,
    groupId: team.group?.id,
    groupCode: team.group?.code
  }));
  const groupMatches: GroupMatchInput[] = matches
    .filter(
      (match) =>
        !match.stage.isKnockout &&
        match.group &&
        match.homeTeam &&
        match.awayTeam
    )
    .map((match) => ({
      groupId: match.groupId ?? "",
      groupCode: match.group?.code ?? "",
      homeTeam: match.homeTeam as TeamRef,
      awayTeam: match.awayTeam as TeamRef,
      homeScore: match.homeScore,
      awayScore: match.awayScore
    }));
  const result = calculateGroupStandings(teamRefs, groupMatches);

  await tx.groupStanding.deleteMany({});

  for (const standing of result.standings) {
    await tx.groupStanding.create({
      data: {
        groupId: standing.groupId,
        teamId: standing.teamId,
        played: standing.played,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalDifference: standing.goalDifference,
        points: standing.points,
        position: standing.position,
        qualifier: standing.qualifier,
        isQualified: standing.isQualified
      }
    });
  }

  return result;
}

async function updateBracket(
  tx: TransactionClient,
  teams: Array<Prisma.NationalTeamGetPayload<{ include: { group: true } }>>,
  matches: MatchWithRelations[],
  standings: { standings: StandingRow[]; bestThirdPlaceTeams: StandingRow[] }
) {
  const teamsById = new Map<string, TeamRef>(
    teams.map((team) => [
      team.id,
      {
        id: team.id,
        name: team.name,
        groupId: team.group?.id,
        groupCode: team.group?.code
      }
    ])
  );
  const updates = advanceBracket(
    matches.map((match) => ({
      id: match.id,
      matchNumber: match.matchNumber,
      homeQualifier: match.homeQualifier,
      awayQualifier: match.awayQualifier,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId
    })),
    {
      standings: standings.standings,
      bestThirdPlaceTeams: standings.bestThirdPlaceTeams,
      teamsById,
      matches: matches.map((match) => ({
        matchNumber: match.matchNumber,
        winnerTeamId: match.winnerTeamId,
        loserTeamId: match.loserTeamId
      }))
    }
  );

  for (const update of updates) {
    await tx.match.update({
      where: { id: update.id },
      data: {
        homeTeamId: update.homeTeamId,
        awayTeamId: update.awayTeamId
      }
    });
  }

  return updates.length;
}
