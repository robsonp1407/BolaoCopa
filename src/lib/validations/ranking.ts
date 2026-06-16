import { z } from "zod";

export const rankingQuerySchema = z.object({
  scope: z.enum(["GENERAL", "GROUP_ROUND", "KNOCKOUT_STAGE"]).default("GENERAL"),
  scopeKey: z.string().trim().min(1).max(50).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

export type RankingQueryInput = z.infer<typeof rankingQuerySchema>;
