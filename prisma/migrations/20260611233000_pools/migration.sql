ALTER TYPE "AuditAction" ADD VALUE 'POOL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'POOL_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'POOL_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'POOL_JOINED';
ALTER TYPE "AuditAction" ADD VALUE 'POOL_LEFT';
ALTER TYPE "AuditAction" ADD VALUE 'POOL_MEMBER_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE 'POOL_OWNER_TRANSFERRED';

CREATE TYPE "PoolStatus" AS ENUM ('ACTIVE', 'DELETED');

CREATE TYPE "PoolMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TABLE "Pool" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "passwordHash" TEXT,
  "joinCode" TEXT NOT NULL,
  "isPrivate" BOOLEAN NOT NULL DEFAULT false,
  "maxParticipants" INTEGER,
  "ownerId" TEXT NOT NULL,
  "tournamentId" TEXT,
  "status" "PoolStatus" NOT NULL DEFAULT 'ACTIVE',
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoolMember" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "PoolMemberRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PoolMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScoreRule" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "exactScorePoints" INTEGER NOT NULL DEFAULT 2,
  "winnerPoints" INTEGER NOT NULL DEFAULT 3,
  "knockoutWinnerPoints" INTEGER NOT NULL DEFAULT 1,
  "singleTeamScorePoints" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScoreRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pool_slug_key" ON "Pool"("slug");
CREATE UNIQUE INDEX "Pool_joinCode_key" ON "Pool"("joinCode");
CREATE INDEX "Pool_ownerId_idx" ON "Pool"("ownerId");
CREATE INDEX "Pool_joinCode_idx" ON "Pool"("joinCode");
CREATE INDEX "Pool_status_idx" ON "Pool"("status");

CREATE UNIQUE INDEX "PoolMember_poolId_userId_key" ON "PoolMember"("poolId", "userId");
CREATE INDEX "PoolMember_userId_idx" ON "PoolMember"("userId");
CREATE INDEX "PoolMember_role_idx" ON "PoolMember"("role");

CREATE UNIQUE INDEX "ScoreRule_poolId_key" ON "ScoreRule"("poolId");

ALTER TABLE "Pool" ADD CONSTRAINT "Pool_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScoreRule" ADD CONSTRAINT "ScoreRule_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
