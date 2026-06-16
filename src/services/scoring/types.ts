export type ScoreRuleValues = {
  exactScorePoints: number;
  winnerPoints: number;
  knockoutWinnerPoints: number;
  singleTeamScorePoints: number;
};

export type PredictionScoreInput = {
  homeScore: number;
  awayScore: number;
  predictedWinnerTeamId: string | null;
};

export type MatchScoreInput = {
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
  stage: {
    isKnockout: boolean;
  };
};

export type PointsBreakdown = {
  resultPoints: number;
  exactScorePoints: number;
  knockoutWinnerPoints: number;
  singleTeamScorePoints: number;
  totalPoints: number;
};
