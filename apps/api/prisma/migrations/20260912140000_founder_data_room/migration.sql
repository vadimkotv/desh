-- The founder's own data room replaces the platform paywall: the founder publishes
-- metrics as time series, keeps some of them gated, and opens those to the agents
-- that ask — seeing exactly whose agent is asking.

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'GATED');
CREATE TYPE "AccessStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED');

-- CreateTable
CREATE TABLE "FounderMetric" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'usd',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "points" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FounderMetric_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FounderMetric_startupId_key_key" ON "FounderMetric"("startupId", "key");
ALTER TABLE "FounderMetric" ADD CONSTRAINT "FounderMetric_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DataAccessRequest" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "AccessStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL DEFAULT '',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataAccessRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DataAccessRequest_startupId_agentId_key" ON "DataAccessRequest"("startupId", "agentId");
CREATE INDEX "DataAccessRequest_status_createdAt_idx" ON "DataAccessRequest"("status", "createdAt");
ALTER TABLE "DataAccessRequest" ADD CONSTRAINT "DataAccessRequest_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DataAccessRequest" ADD CONSTRAINT "DataAccessRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
