CREATE TYPE "RankingScope" AS ENUM ('GENERAL', 'GROUP_ROUND', 'KNOCKOUT_STAGE');

CREATE TABLE "RankingSnapshot" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scope" "RankingScope" NOT NULL,
  "scopeKey" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "exactScoreHits" INTEGER NOT NULL DEFAULT 0,
  "resultHits" INTEGER NOT NULL DEFAULT 0,
  "earliestPrediction" TIMESTAMP(3),
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RankingSnapshot_poolId_userId_scope_scopeKey_key"
  ON "RankingSnapshot"("poolId", "userId", "scope", "scopeKey");
CREATE UNIQUE INDEX "RankingSnapshot_poolId_scope_scopeKey_position_key"
  ON "RankingSnapshot"("poolId", "scope", "scopeKey", "position");
CREATE INDEX "RankingSnapshot_poolId_scope_scopeKey_position_idx"
  ON "RankingSnapshot"("poolId", "scope", "scopeKey", "position");
CREATE INDEX "RankingSnapshot_poolId_scope_scopeKey_totalPoints_exactScoreHits_resultHits_idx"
  ON "RankingSnapshot"("poolId", "scope", "scopeKey", "totalPoints", "exactScoreHits", "resultHits");
CREATE INDEX "RankingSnapshot_userId_idx" ON "RankingSnapshot"("userId");
CREATE INDEX "RankingSnapshot_calculatedAt_idx"
  ON "RankingSnapshot"("calculatedAt");

ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
