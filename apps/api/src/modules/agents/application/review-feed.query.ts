import { Inject, Injectable } from '@nestjs/common';
import type { Decision, DueDiligencePreview, ReviewFeedItem, ReviewState } from '@agentipo/shared';
import { ReportQueries } from '../../due-diligence/application/report-queries.usecase';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { DECISION_REPOSITORY, type DecisionRepository } from '../domain/decision.repository';
import { mandateGate } from '../domain/mandate.gate';
import { AgentQueries } from './agent-queries.usecase';

const DECISION_WINDOW = 500;

// The "waiting for review" feed. Eligibility is the mandate gate — the same
// deterministic filter the runtime applies before it spends anything — so what the
// dashboard shows and what an agent will actually pick up can never drift apart.
@Injectable()
export class ReviewFeedQuery {
  constructor(
    @Inject(DECISION_REPOSITORY) private readonly decisions: DecisionRepository,
    private readonly agents: AgentQueries,
    private readonly rounds: RoundQueries,
    private readonly reports: ReportQueries,
  ) {}

  async execute(): Promise<ReviewFeedItem[]> {
    const [records, rounds, decisions] = await Promise.all([
      this.agents.listRecords(),
      this.rounds.list(),
      this.decisions.listAll(DECISION_WINDOW),
    ]);
    const running = records.filter((agent) => agent.status === 'RUNNING');
    const items = await Promise.all(rounds.map((round) => this.item(round, running, decisions)));
    return items.filter((item): item is ReviewFeedItem => item !== null);
  }

  private async item(
    round: RoundDetail,
    running: AgentRecord[],
    decisions: Decision[],
  ): Promise<ReviewFeedItem | null> {
    const invested = round.investments.some((i) => i.status === 'CONFIRMED');
    if (!invested && round.status !== 'OPEN') return null;

    const preview = await this.preview(round.id);
    const watchers = running.filter((agent) => this.watches(agent, round, preview));
    if (!invested && watchers.length === 0) return null;

    return {
      roundId: round.id,
      state: this.state(round.id, invested, watchers, decisions),
      score: preview?.score ?? null,
      watchers: watchers.map((agent) => ({ agentId: agent.id, agentName: agent.name })),
    };
  }

  // Sector match plus the mandate gate. A round with no report yet stays eligible:
  // the agent buys the report first and only then finds out whether it qualifies.
  private watches(agent: AgentRecord, round: RoundDetail, preview: DueDiligencePreview | null): boolean {
    const sector = round.startup.sector.toLowerCase();
    if (!agent.mandate.sectors.some((s) => s.toLowerCase() === sector)) return false;
    return preview === null || mandateGate(agent.mandate, preview).pass;
  }

  private state(
    roundId: string,
    invested: boolean,
    watchers: AgentRecord[],
    decisions: Decision[],
  ): ReviewState {
    if (invested) return 'INVESTED';
    const ids = new Set(watchers.map((agent) => agent.id));
    const reviewed = decisions.some((d) => d.roundId === roundId && ids.has(d.agentId));
    return reviewed ? 'REVIEWED' : 'WAITING';
  }

  private async preview(roundId: string): Promise<DueDiligencePreview | null> {
    try {
      return await this.reports.preview(roundId);
    } catch {
      return null; // no report generated for this round yet
    }
  }
}
