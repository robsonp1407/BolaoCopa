CREATE TYPE "AuditAction" AS ENUM ('MATCH_RESULT_REGISTERED', 'TOURNAMENT_RECALCULATED');

ALTER TABLE "Match"
  ADD COLUMN "winnerTeamId" TEXT,
  ADD COLUMN "loserTeamId" TEXT,
  ADD COLUMN "homeQualifier" TEXT,
  ADD COLUMN "awayQualifier" TEXT,
  ADD COLUMN "homeScore" INTEGER,
  ADD COLUMN "awayScore" INTEGER,
  ADD COLUMN "homePenaltyScore" INTEGER,
  ADD COLUMN "awayPenaltyScore" INTEGER;

UPDATE "Match"
SET
  "homeQualifier" = COALESCE("homeQualifier", "homeSlot"),
  "awayQualifier" = COALESCE("awayQualifier", "awaySlot")
WHERE "homeQualifier" IS NULL OR "awayQualifier" IS NULL;

CREATE TABLE "GroupStanding" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "played" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "draws" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "goalsFor" INTEGER NOT NULL DEFAULT 0,
  "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
  "goalDifference" INTEGER NOT NULL DEFAULT 0,
  "points" INTEGER NOT NULL DEFAULT 0,
  "position" INTEGER NOT NULL,
  "qualifier" TEXT,
  "isQualified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GroupStanding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "userId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Match_winnerTeamId_idx" ON "Match"("winnerTeamId");
CREATE INDEX "Match_loserTeamId_idx" ON "Match"("loserTeamId");

CREATE UNIQUE INDEX "GroupStanding_groupId_teamId_key" ON "GroupStanding"("groupId", "teamId");
CREATE UNIQUE INDEX "GroupStanding_groupId_position_key" ON "GroupStanding"("groupId", "position");
CREATE UNIQUE INDEX "GroupStanding_qualifier_key" ON "GroupStanding"("qualifier");
CREATE INDEX "GroupStanding_teamId_idx" ON "GroupStanding"("teamId");
CREATE INDEX "GroupStanding_points_goalDifference_goalsFor_idx" ON "GroupStanding"("points", "goalDifference", "goalsFor");

CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerTeamId_fkey"
  FOREIGN KEY ("winnerTeamId") REFERENCES "NationalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Match" ADD CONSTRAINT "Match_loserTeamId_fkey"
  FOREIGN KEY ("loserTeamId") REFERENCES "NationalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GroupStanding" ADD CONSTRAINT "GroupStanding_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupStanding" ADD CONSTRAINT "GroupStanding_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "NationalTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
