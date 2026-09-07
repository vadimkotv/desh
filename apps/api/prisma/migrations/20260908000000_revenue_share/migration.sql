-- AlterEnum
ALTER TYPE "RoundStatus" ADD VALUE 'REPAID';

-- AlterTable
ALTER TABLE "Round" ADD COLUMN "returnCapBps" INTEGER NOT NULL DEFAULT 15000,
                    ADD COLUMN "distributedUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "Investment" ADD COLUMN "claimedUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "amountUsdc" DECIMAL(18,6) NOT NULL,
    "txHash" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Distribution_roundId_createdAt_idx" ON "Distribution"("roundId", "createdAt");
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
