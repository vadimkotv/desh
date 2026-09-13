-- Onboarding: a person signs in through Privy and says which side they are on.
-- A founder lists a startup; an investor writes a mandate and gets an agent.

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('FOUNDER', 'INVESTOR');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "privyDid" TEXT NOT NULL,
    "role" "AccountRole",
    "walletAddress" TEXT,
    "email" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Account_privyDid_key" ON "Account"("privyDid");

-- AlterTable: ownership is optional, so seeded demo data stays valid.
ALTER TABLE "Startup" ADD COLUMN "ownerAccountId" TEXT, ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Agent" ADD COLUMN "ownerAccountId" TEXT;
ALTER TABLE "Startup" ADD CONSTRAINT "Startup_ownerAccountId_fkey" FOREIGN KEY ("ownerAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_ownerAccountId_fkey" FOREIGN KEY ("ownerAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
