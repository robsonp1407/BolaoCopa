import type { RankedEntry, RankingEntryInput } from "./types";

export function rankEntries(entries: RankingEntryInput[]): RankedEntry[] {
  return [...entries]
    .sort(compareRankingEntries)
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

function compareRankingEntries(a: RankingEntryInput, b: RankingEntryInput) {
  return (
    b.totalPoints - a.totalPoints ||
    b.exactScoreHits - a.exactScoreHits ||
    b.resultHits - a.resultHits ||
    compareEarliestPrediction(a.earliestPrediction, b.earliestPrediction) ||
    a.userId.localeCompare(b.userId)
  );
}

function compareEarliestPrediction(a: Date | null, b: Date | null) {
  if (a && b) {
    return a.getTime() - b.getTime();
  }

  if (a) {
    return -1;
  }

  if (b) {
    return 1;
  }

  return 0;
}
