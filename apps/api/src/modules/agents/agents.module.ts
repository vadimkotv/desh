import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DataRoomModule } from '../data-room/data-room.module';
import { PaymentsModule } from '../payments/payments.module';
import { SettlementModule } from '../settlement/settlement.module';
import { StartupsModule } from '../startups/startups.module';
import { AcquireReportStep } from './application/acquire-report.step';
import { AgentQueries } from './application/agent-queries.usecase';
import { CreateAgentUseCase } from './application/create-agent.usecase';
import { DecideRoundStep } from './application/decide-round.step';
import { ExecuteDecisionStep } from './application/execute-decision.step';
import { RegisterIdentityUseCase } from './application/register-identity.usecase';
import { RunAgentUseCase } from './application/run-agent.usecase';
import { AGENT_REPOSITORY } from './domain/agent.repository';
import { DECISION_ENGINES } from './domain/decision-engine.port';
import { DECISION_REPOSITORY } from './domain/decision.repository';
import { AGENT_IDENTITY } from './domain/identity.port';
import { DecisionEngineResolver } from './infrastructure/engines/decision-engine.resolver';
import { LlmDecisionEngine } from './infrastructure/engines/llm.decision-engine';
import { RulesDecisionEngine } from './infrastructure/engines/rules.decision-engine';
import { Erc8004IdentityClient } from './infrastructure/erc8004/erc8004-identity.client';
import { HederaAccountFactory } from './infrastructure/hedera/hedera-account.factory';
import { PrismaAgentRepository } from './infrastructure/prisma-agent.repository';
import { PrismaDecisionRepository } from './infrastructure/prisma-decision.repository';
import { AgentsController } from './presentation/agents.controller';
import { DecisionsController } from './presentation/decisions.controller';

@Module({
  imports: [StartupsModule, DataRoomModule, PaymentsModule, SettlementModule, AuditModule],
  controllers: [AgentsController, DecisionsController],
  providers: [
    LlmDecisionEngine,
    RulesDecisionEngine,
    DecisionEngineResolver,
    HederaAccountFactory,
    AcquireReportStep,
    DecideRoundStep,
    ExecuteDecisionStep,
    RunAgentUseCase,
    CreateAgentUseCase,
    RegisterIdentityUseCase,
    AgentQueries,
    { provide: AGENT_REPOSITORY, useClass: PrismaAgentRepository },
    { provide: DECISION_REPOSITORY, useClass: PrismaDecisionRepository },
    { provide: AGENT_IDENTITY, useClass: Erc8004IdentityClient },
    {
      provide: DECISION_ENGINES,
      inject: [LlmDecisionEngine, RulesDecisionEngine],
      useFactory: (llm: LlmDecisionEngine, rules: RulesDecisionEngine) => [llm, rules],
    },
  ],
})
export class AgentsModule {}
