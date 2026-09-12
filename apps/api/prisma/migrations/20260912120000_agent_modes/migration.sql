-- Two ways an agent may act: settle on its own, or file a proposal a human approves.

-- CreateEnum
CREATE TYPE "AgentMode" AS ENUM ('AUTONOMOUS', 'ADVISORY');
CREATE TYPE "ApprovalState" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "mode" "AgentMode" NOT NULL DEFAULT 'AUTONOMOUS';

-- AlterTable: decisions from an ADVISORY agent wait for a human; everything already
-- recorded was settled autonomously, so it keeps NOT_REQUIRED.
ALTER TABLE "Decision"
ADD COLUMN "approval" "ApprovalState" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "approvedBy" TEXT,
ADD COLUMN "decidedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Decision_approval_createdAt_idx" ON "Decision"("approval", "createdAt");
