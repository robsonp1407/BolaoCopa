ALTER TYPE "AuditAction" ADD VALUE 'PREDICTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'PREDICTION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PREDICTION_LOCKED_ATTEMPT';
ALTER TYPE "AuditAction" ADD VALUE 'PREDICTION_QUICK_SAVE';

CREATE TABLE "Prediction" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "homeScore" INTEGER NOT NULL,
  "awayScore" INTEGER NOT NULL,
  "homePenaltyScore" INTEGER,
  "awayPenaltyScore" INTEGER,
  "predictedWinnerTeamId" TEXT,
  "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PredictionHistory" (
  "id" TEXT NOT NULL,
  "predictionId" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "previousHomeScore" INTEGER NOT NULL,
  "previousAwayScore" INTEGER NOT NULL,
  "previousHomePenaltyScore" INTEGER,
  "previousAwayPenaltyScore" INTEGER,
  "previousWinnerTeamId" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "changedByUserId" TEXT NOT NULL,

  CONSTRAINT "PredictionHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Prediction_poolId_userId_matchId_key"
  ON "Prediction"("poolId", "userId", "matchId");
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");
CREATE INDEX "Prediction_predictedWinnerTeamId_idx"
  ON "Prediction"("predictedWinnerTeamId");

CREATE INDEX "PredictionHistory_predictionId_idx"
  ON "PredictionHistory"("predictionId");
CREATE INDEX "PredictionHistory_poolId_userId_matchId_idx"
  ON "PredictionHistory"("poolId", "userId", "matchId");
CREATE INDEX "PredictionHistory_matchId_idx" ON "PredictionHistory"("matchId");
CREATE INDEX "PredictionHistory_changedByUserId_idx"
  ON "PredictionHistory"("changedByUserId");
CREATE INDEX "PredictionHistory_previousWinnerTeamId_idx"
  ON "PredictionHistory"("previousWinnerTeamId");

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_predictedWinnerTeamId_fkey"
  FOREIGN KEY ("predictedWinnerTeamId") REFERENCES "NationalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PredictionHistory" ADD CONSTRAINT "PredictionHistory_predictionId_fkey"
  FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PredictionHistory" ADD CONSTRAINT "PredictionHistory_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PredictionHistory" ADD CONSTRAINT "PredictionHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PredictionHistory" ADD CONSTRAINT "PredictionHistory_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PredictionHistory" ADD CONSTRAINT "PredictionHistory_previousWinnerTeamId_fkey"
  FOREIGN KEY ("previousWinnerTeamId") REFERENCES "NationalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PredictionHistory" ADD CONSTRAINT "PredictionHistory_changedByUserId_fkey"
  FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
