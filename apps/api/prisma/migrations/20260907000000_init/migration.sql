-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('OPEN', 'FUNDED', 'FAILED', 'CLOSED');
CREATE TYPE "WalletKind" AS ENUM ('LOCAL_KEY', 'CIRCLE');
CREATE TYPE "DecisionAction" AS ENUM ('INVEST', 'PASS', 'WATCH');
CREATE TYPE "InvestmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "Startup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "website" TEXT,
    "founderAddress" TEXT NOT NULL,
    "treasuryAddress" TEXT NOT NULL,
    "tokenAddress" TEXT,
    "tokenNetwork" TEXT NOT NULL DEFAULT 'mainnet',
    "githubRepo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Startup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "onchainRoundId" INTEGER,
    "escrowAddress" TEXT,
    "targetUsdc" DECIMAL(18,6) NOT NULL,
    "raisedUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "minTicketUsdc" DECIMAL(18,6) NOT NULL DEFAULT 10,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'OPEN',
    "milestones" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataRoomSnapshot" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "error" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataRoomSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DueDiligenceReport" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "dataCoverage" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "signals" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DueDiligenceReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "walletKind" "WalletKind" NOT NULL DEFAULT 'LOCAL_KEY',
    "keyIndex" SERIAL NOT NULL,
    "walletAddress" TEXT,
    "circleWalletId" TEXT,
    "hederaAccountId" TEXT,
    "erc8004AgentId" TEXT,
    "erc8004ChainId" INTEGER,
    "erc8004TxHash" TEXT,
    "mandate" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "reportId" TEXT,
    "action" "DecisionAction" NOT NULL,
    "amountUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "keyRisks" JSONB NOT NULL,
    "engine" TEXT NOT NULL,
    "dataPaymentTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amountUsdc" DECIMAL(18,6) NOT NULL,
    "chainId" INTEGER NOT NULL,
    "txHash" TEXT,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);
