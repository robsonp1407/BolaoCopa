import type {
  MatchScoreInput,
  PointsBreakdown,
  PredictionScoreInput,
  ScoreRuleValues
} from "./types";

export const DEFAULT_POINTS_RULE: ScoreRuleValues = {
  exactScorePoints: 2,
  winnerPoints: 3,
  knockoutWinnerPoints: 1,
  singleTeamScorePoints: 1
};

export function calculatePredictionPoints(
  prediction: PredictionScoreInput,
  match: MatchScoreInput,
  rule: ScoreRuleValues = DEFAULT_POINTS_RULE
): PointsBreakdown {
  if (match.homeScore === null || match.awayScore === null) {
    return emptyBreakdown();
  }

  const resultPoints = hasCorrectResult(prediction, match)
    ? rule.winnerPoints
    : 0;
  const exactScorePoints =
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore
      ? rule.exactScorePoints
      : 0;
  const knockoutWinnerPoints =
    match.stage.isKnockout &&
    prediction.predictedWinnerTeamId !== null &&
    prediction.predictedWinnerTeamId === match.winnerTeamId
      ? rule.knockoutWinnerPoints
      : 0;
  const singleTeamScorePoints =
    exactScorePoints === 0 &&
    (prediction.homeScore === match.homeScore ||
      prediction.awayScore === match.awayScore)
      ? rule.singleTeamScorePoints
      : 0;

  return {
    resultPoints,
    exactScorePoints,
    knockoutWinnerPoints,
    singleTeamScorePoints,
    totalPoints:
      resultPoints +
      exactScorePoints +
      knockoutWinnerPoints +
      singleTeamScorePoints
  };
}

function hasCorrectResult(
  prediction: PredictionScoreInput,
  match: MatchScoreInput
) {
  const predictedOutcome = getOutcome(
    prediction.homeScore,
    prediction.awayScore,
    prediction.predictedWinnerTeamId,
    match.homeTeamId,
    match.awayTeamId
  );
  const officialOutcome = getOutcome(
    match.homeScore,
    match.awayScore,
    match.winnerTeamId,
    match.homeTeamId,
    match.awayTeamId
  );

  return predictedOutcome === officialOutcome;
}

function getOutcome(
  homeScore: number | null,
  awayScore: number | null,
  winnerTeamId: string | null,
  homeTeamId: string | null,
  awayTeamId: string | null
) {
  if (homeScore === null || awayScore === null) {
    return "UNKNOWN";
  }

  if (homeScore > awayScore) {
    return homeTeamId ?? "HOME";
  }

  if (awayScore > homeScore) {
    return awayTeamId ?? "AWAY";
  }

  return winnerTeamId ?? "DRAW";
}

function emptyBreakdown(): PointsBreakdown {
  return {
    resultPoints: 0,
    exactScorePoints: 0,
    knockoutWinnerPoints: 0,
    singleTeamScorePoints: 0,
    totalPoints: 0
  };
}
