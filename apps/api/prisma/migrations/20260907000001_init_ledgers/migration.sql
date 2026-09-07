-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "resource" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "txId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "hcsTopicId" TEXT,
    "hcsSequenceNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataRoomSnapshot_startupId_source_fetchedAt_idx" ON "DataRoomSnapshot"("startupId", "source", "fetchedAt");
CREATE INDEX "DueDiligenceReport_roundId_createdAt_idx" ON "DueDiligenceReport"("roundId", "createdAt");
CREATE UNIQUE INDEX "Agent_keyIndex_key" ON "Agent"("keyIndex");
CREATE INDEX "Decision_agentId_createdAt_idx" ON "Decision"("agentId", "createdAt");
CREATE UNIQUE INDEX "Investment_decisionId_key" ON "Investment"("decisionId");
CREATE INDEX "PaymentReceipt_createdAt_idx" ON "PaymentReceipt"("createdAt");
CREATE INDEX "AuditEntry_createdAt_idx" ON "AuditEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DataRoomSnapshot" ADD CONSTRAINT "DataRoomSnapshot_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DueDiligenceReport" ADD CONSTRAINT "DueDiligenceReport_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DueDiligenceReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
