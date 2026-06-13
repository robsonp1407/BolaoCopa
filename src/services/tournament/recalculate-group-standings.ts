import type { GroupMatchInput, QualifiedTeams, StandingRow, TeamRef } from "./types";

const QUALIFIED_THIRD_PLACE_COUNT = 8;

type MutableStandingRow = Omit<StandingRow, "position" | "qualifier" | "isQualified">;

export function sortStandings<T extends Pick<StandingRow, "points" | "goalDifference" | "goalsFor" | "teamName">>(
  standings: T[]
) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return a.teamName.localeCompare(b.teamName);
  });
}

export function calculateGroupStandings(
  teams: TeamRef[],
  matches: GroupMatchInput[]
): QualifiedTeams {
  const rows = new Map<string, MutableStandingRow>();

  for (const team of teams) {
    if (!team.groupCode) {
      continue;
    }

    rows.set(team.id, {
      groupId: team.groupId ?? "",
      groupCode: team.groupCode,
      teamId: team.id,
      teamName: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    });
  }

  for (const match of matches) {
    ensureTeamRow(rows, match.homeTeam, match.groupId, match.groupCode);
    ensureTeamRow(rows, match.awayTeam, match.groupId, match.groupCode);

    if (match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const home = rows.get(match.homeTeam.id);
    const away = rows.get(match.awayTeam.id);

    if (!home || !away) {
      continue;
    }

    applyResult(home, match.homeScore, match.awayScore);
    applyResult(away, match.awayScore, match.homeScore);
  }

  const groupedRows = new Map<string, MutableStandingRow[]>();
  for (const row of rows.values()) {
    if (!row.groupCode) {
      continue;
    }
    const group = groupedRows.get(row.groupCode) ?? [];
    group.push(row);
    groupedRows.set(row.groupCode, group);
  }

  const standings: StandingRow[] = [];
  const groupCodes = [...groupedRows.keys()].sort();

  for (const groupCode of groupCodes) {
    const sortedRows = sortStandings(groupedRows.get(groupCode) ?? []);
    sortedRows.forEach((row, index) => {
      const position = index + 1;
      standings.push({
        ...row,
        position,
        qualifier: `${position}${groupCode}`,
        isQualified: position <= 2
      });
    });
  }

  const bestThirdPlaceTeams = determineBestThirdPlaceTeams(standings);
  const qualifiedThirdIds = new Set(bestThirdPlaceTeams.map((row) => row.teamId));

  return {
    standings: standings.map((row) => ({
      ...row,
      isQualified: row.isQualified || qualifiedThirdIds.has(row.teamId)
    })),
    bestThirdPlaceTeams
  };
}

export function determineBestThirdPlaceTeams(standings: StandingRow[]) {
  return sortStandings(standings.filter((row) => row.position === 3)).slice(
    0,
    QUALIFIED_THIRD_PLACE_COUNT
  );
}

function ensureTeamRow(
  rows: Map<string, MutableStandingRow>,
  team: TeamRef,
  groupId: string,
  groupCode: string
) {
  if (rows.has(team.id)) {
    return;
  }

  rows.set(team.id, {
    groupId,
    groupCode,
    teamId: team.id,
    teamName: team.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  });
}

function applyResult(row: MutableStandingRow, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 3;
    return;
  }

  if (goalsFor < goalsAgainst) {
    row.losses += 1;
    return;
  }

  row.draws += 1;
  row.points += 1;
}
