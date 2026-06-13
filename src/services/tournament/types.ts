export type TeamRef = {
  id: string;
  name: string;
  groupId?: string | null;
  groupCode?: string | null;
};

export type MatchResultInput = {
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
};

export type StandingRow = {
  groupId: string;
  groupCode: string;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  qualifier: string;
  isQualified: boolean;
};

export type GroupMatchInput = {
  groupId: string;
  groupCode: string;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeScore: number | null;
  awayScore: number | null;
};

export type QualifiedTeams = {
  standings: StandingRow[];
  bestThirdPlaceTeams: StandingRow[];
};
