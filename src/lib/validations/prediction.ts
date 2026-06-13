import { z } from "zod";

const nullableNonNegativeInt = z
  .number()
  .int("Informe um numero inteiro")
  .min(0, "O placar nao pode ser negativo")
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const predictionPayloadSchema = z.object({
  homeScore: z
    .number()
    .int("Informe um numero inteiro")
    .min(0, "O placar nao pode ser negativo"),
  awayScore: z
    .number()
    .int("Informe um numero inteiro")
    .min(0, "O placar nao pode ser negativo"),
  homePenaltyScore: nullableNonNegativeInt,
  awayPenaltyScore: nullableNonNegativeInt,
  predictedWinnerTeamId: z.string().min(1).nullable().optional().default(null)
});

export const quickPredictionsSchema = z.object({
  predictions: z
    .array(
      predictionPayloadSchema.extend({
        matchId: z.string().min(1, "Informe o jogo")
      })
    )
    .min(1, "Informe ao menos um palpite")
});

export type PredictionPayload = z.infer<typeof predictionPayloadSchema>;
export type QuickPredictionsPayload = z.infer<typeof quickPredictionsSchema>;
