import type { RankingScope } from "@prisma/client";

export type RankingEntryInput = {
  poolId: string;
  userId: string;
  totalPoints: number;
  exactScoreHits: number;
  resultHits: number;
  earliestPrediction: Date | null;
};

export type RankedEntry = RankingEntryInput & {
  position: number;
};

export type RankingScopeInput = {
  scope: RankingScope;
  scopeKey: string;
};
