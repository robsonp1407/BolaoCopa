CREATE TYPE "Confederation" AS ENUM ('AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA');

CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'POSTPONED', 'CANCELED');

CREATE TABLE "NationalTeam" (
  "id" TEXT NOT NULL,
  "fifaCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "flagEmoji" TEXT,
  "confederation" "Confederation",
  "groupId" TEXT,
  "groupPosition" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NationalTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HostCity" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HostCity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Stadium" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "capacity" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Stadium_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TournamentGroup" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TournamentGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TournamentStage" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "isKnockout" BOOLEAN NOT NULL DEFAULT false,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "expectedMatches" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TournamentStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "matchNumber" INTEGER NOT NULL,
  "stageId" TEXT NOT NULL,
  "groupId" TEXT,
  "stadiumId" TEXT,
  "homeTeamId" TEXT,
  "awayTeamId" TEXT,
  "homeSlot" TEXT,
  "awaySlot" TEXT,
  "startsAt" TIMESTAMP(3),
  "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NationalTeam_fifaCode_key" ON "NationalTeam"("fifaCode");
CREATE UNIQUE INDEX "NationalTeam_slug_key" ON "NationalTeam"("slug");
CREATE UNIQUE INDEX "NationalTeam_groupId_groupPosition_key" ON "NationalTeam"("groupId", "groupPosition");
CREATE INDEX "NationalTeam_groupId_idx" ON "NationalTeam"("groupId");

CREATE UNIQUE INDEX "HostCity_slug_key" ON "HostCity"("slug");

CREATE UNIQUE INDEX "Stadium_slug_key" ON "Stadium"("slug");
CREATE INDEX "Stadium_cityId_idx" ON "Stadium"("cityId");

CREATE UNIQUE INDEX "TournamentGroup_code_key" ON "TournamentGroup"("code");

CREATE UNIQUE INDEX "TournamentStage_code_key" ON "TournamentStage"("code");

CREATE UNIQUE INDEX "Match_matchNumber_key" ON "Match"("matchNumber");
CREATE INDEX "Match_stageId_idx" ON "Match"("stageId");
CREATE INDEX "Match_groupId_idx" ON "Match"("groupId");
CREATE INDEX "Match_stadiumId_idx" ON "Match"("stadiumId");
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");
CREATE INDEX "Match_startsAt_idx" ON "Match"("startsAt");

ALTER TABLE "NationalTeam" ADD CONSTRAINT "NationalTeam_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Stadium" ADD CONSTRAINT "Stadium_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "HostCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match" ADD CONSTRAINT "Match_stageId_fkey"
  FOREIGN KEY ("stageId") REFERENCES "TournamentStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Match" ADD CONSTRAINT "Match_stadiumId_fkey"
  FOREIGN KEY ("stadiumId") REFERENCES "Stadium"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey"
  FOREIGN KEY ("homeTeamId") REFERENCES "NationalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey"
  FOREIGN KEY ("awayTeamId") REFERENCES "NationalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
