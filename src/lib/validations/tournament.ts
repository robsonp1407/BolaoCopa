import { z } from "zod";

const nullableScoreSchema = z.number().int().min(0).nullable();

export const registerMatchResultSchema = z
  .object({
    homeScore: nullableScoreSchema,
    awayScore: nullableScoreSchema,
    homePenaltyScore: nullableScoreSchema.optional().default(null),
    awayPenaltyScore: nullableScoreSchema.optional().default(null)
  })
  .superRefine((value, context) => {
    const hasHomeScore = value.homeScore !== null;
    const hasAwayScore = value.awayScore !== null;

    if (hasHomeScore !== hasAwayScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe os dois placares ou deixe ambos nulos",
        path: ["awayScore"]
      });
    }

    const hasHomePenalty = value.homePenaltyScore !== null;
    const hasAwayPenalty = value.awayPenaltyScore !== null;

    if (hasHomePenalty !== hasAwayPenalty) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe os dois placares de penaltis ou deixe ambos nulos",
        path: ["awayPenaltyScore"]
      });
    }
  });

export type RegisterMatchResultInput = z.infer<typeof registerMatchResultSchema>;
