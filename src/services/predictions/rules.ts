import type { TournamentStage } from "@prisma/client";

import type { PredictionPayload } from "@/lib/validations/prediction";

import { PredictionServiceError } from "./errors";

type MatchForPredictionRules = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  stage: Pick<TournamentStage, "isKnockout">;
};

export function validatePredictionAgainstMatch(
  input: PredictionPayload,
  match: MatchForPredictionRules
) {
  const isDraw = input.homeScore === input.awayScore;

  if (match.stage.isKnockout && isDraw && !input.predictedWinnerTeamId) {
    throw new PredictionServiceError(
      "Informe o vencedor previsto para jogos eliminatorios empatados",
      400,
      "KNOCKOUT_WINNER_REQUIRED"
    );
  }

  if (!input.predictedWinnerTeamId) {
    return;
  }

  const knownTeamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean);

  if (
    knownTeamIds.length > 0 &&
    !knownTeamIds.includes(input.predictedWinnerTeamId)
  ) {
    throw new PredictionServiceError(
      "O vencedor previsto precisa ser uma das selecoes da partida",
      400,
      "INVALID_PREDICTED_WINNER"
    );
  }
}
