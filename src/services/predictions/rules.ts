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
  const knownTeamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean);

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

  if (knownTeamIds.length < 2) {
    throw new PredictionServiceError(
      "Aguarde a definicao das selecoes da partida para informar o vencedor previsto",
      400,
      "MATCH_TEAMS_NOT_DEFINED"
    );
  }

  if (!knownTeamIds.includes(input.predictedWinnerTeamId)) {
    throw new PredictionServiceError(
      "O vencedor previsto precisa ser uma das selecoes da partida",
      400,
      "INVALID_PREDICTED_WINNER"
    );
  }
}
