ALTER TYPE "AuditAction" ADD VALUE 'POINTS_RECALCULATED';

CREATE TABLE "PointsHistory" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "predictionId" TEXT NOT NULL,
  "resultPoints" INTEGER NOT NULL DEFAULT 0,
  "exactScorePoints" INTEGER NOT NULL DEFAULT 0,
  "knockoutWinnerPoints" INTEGER NOT NULL DEFAULT 0,
  "singleTeamScorePoints" INTEGER NOT NULL DEFAULT 0,
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PointsHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PointsHistory_predictionId_key"
  ON "PointsHistory"("predictionId");
CREATE UNIQUE INDEX "PointsHistory_poolId_userId_matchId_key"
  ON "PointsHistory"("poolId", "userId", "matchId");
CREATE INDEX "PointsHistory_poolId_idx" ON "PointsHistory"("poolId");
CREATE INDEX "PointsHistory_userId_idx" ON "PointsHistory"("userId");
CREATE INDEX "PointsHistory_matchId_idx" ON "PointsHistory"("matchId");
CREATE INDEX "PointsHistory_totalPoints_idx" ON "PointsHistory"("totalPoints");
CREATE INDEX "PointsHistory_calculatedAt_idx"
  ON "PointsHistory"("calculatedAt");

ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_predictionId_fkey"
  FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
