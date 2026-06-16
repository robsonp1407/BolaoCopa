import { z } from "zod";

export const retroactivePredictionSchema = z
  .object({
    user_id: z.string().min(1, "Informe o participante"),
    match_id: z.string().min(1, "Informe o jogo"),
    pool_id: z.string().min(1, "Informe o bolao"),
    home_score: z
      .number()
      .int("Informe um numero inteiro")
      .min(0, "O placar nao pode ser negativo"),
    away_score: z
      .number()
      .int("Informe um numero inteiro")
      .min(0, "O placar nao pode ser negativo"),
    predicted_winner_team_id: z.string().min(1).nullable().optional()
  })
  .transform((data) => ({
    userId: data.user_id,
    matchId: data.match_id,
    poolId: data.pool_id,
    homeScore: data.home_score,
    awayScore: data.away_score,
    predictedWinnerTeamId: data.predicted_winner_team_id ?? null
  }));

export type RetroactivePredictionInput = z.infer<
  typeof retroactivePredictionSchema
>;
