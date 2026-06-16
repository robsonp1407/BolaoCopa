ALTER TABLE "RankingSnapshot"
  ADD COLUMN "matchId" TEXT;

CREATE INDEX "RankingSnapshot_matchId_idx"
  ON "RankingSnapshot"("matchId");

ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
