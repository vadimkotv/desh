-- Exit-based returns replace the revenue-share cap: a round pays out only on a
-- liquidity event (acquisition / IPO / TGE / contract), pro-rata and uncapped.

-- AlterEnum: REPAID -> EXITED. Renaming keeps existing rows valid and, unlike
-- ADD VALUE + UPDATE, is safe inside the transaction `prisma migrate` wraps this in
-- (Postgres refuses to use an enum value added in the same transaction).
ALTER TYPE "RoundStatus" RENAME VALUE 'REPAID' TO 'EXITED';

-- CreateEnum
CREATE TYPE "ExitKind" AS ENUM ('ACQUISITION', 'IPO', 'TGE', 'CONTRACT');

-- AlterTable: the stake sold replaces the return cap; proceeds replace revenue.
ALTER TABLE "Round" RENAME COLUMN "returnCapBps" TO "equityBps";
ALTER TABLE "Round" ALTER COLUMN "equityBps" SET DEFAULT 800;
UPDATE "Round" SET "equityBps" = 800 WHERE "equityBps" > 5000;
ALTER TABLE "Round" RENAME COLUMN "distributedUsdc" TO "proceedsUsdc";
ALTER TABLE "Round" ADD COLUMN "releasedUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0;

-- AlterTable: public links of a startup (site, twitter, docs...).
ALTER TABLE "Startup" ADD COLUMN "links" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "ExitEvent" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "kind" "ExitKind" NOT NULL,
    "valuationUsdc" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "proceedsUsdc" DECIMAL(18,6) NOT NULL,
    "evidenceUri" TEXT NOT NULL DEFAULT '',
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExitEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExitEvent_roundId_createdAt_idx" ON "ExitEvent"("roundId", "createdAt");
ALTER TABLE "ExitEvent" ADD CONSTRAINT "ExitEvent_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropTable
DROP TABLE "Distribution";
