import type { Agent, Decision, DueDiligencePreview } from '@agentipo/shared';
import type { RoundDetail } from './types';

export type ReviewState = 'WAITING' | 'REVIEWED' | 'INVESTED';

const invested = (round: RoundDetail): boolean =>
  round.investments.some((investment) => investment.status === 'CONFIRMED');

const sectorMatches = (round: RoundDetail, agent: Agent): boolean =>
  agent.mandate.sectors.some(
    (sector) => sector.toLowerCase() === round.startup.sector.toLowerCase(),
  );

export function potentialReviewRounds(rounds: RoundDetail[], agents: Agent[]): RoundDetail[] {
  const running = agents.filter((agent) => agent.status === 'RUNNING');
  return rounds.filter(
    (round) =>
      invested(round) ||
      (round.status === 'OPEN' && running.some((agent) => sectorMatches(round, agent))),
  );
}

export function eligibleReviewRounds(
  rounds: RoundDetail[],
  agents: Agent[],
  previews: Map<string, DueDiligencePreview | null>,
): RoundDetail[] {
  const running = agents.filter((agent) => agent.status === 'RUNNING');
  return rounds.filter((round) => {
    if (invested(round)) return true;
    const preview = previews.get(round.id);
    return running.some(
      (agent) =>
        sectorMatches(round, agent) && (!preview || preview.score >= agent.mandate.minScore),
    );
  });
}

export function reviewState(
  round: RoundDetail,
  decisions: Decision[],
  agents: Agent[],
): ReviewState {
  if (invested(round)) return 'INVESTED';
  const runningIds = new Set(
    agents.filter((agent) => agent.status === 'RUNNING').map((agent) => agent.id),
  );
  return decisions.some(
    (decision) => decision.roundId === round.id && runningIds.has(decision.agentId),
  )
    ? 'REVIEWED'
    : 'WAITING';
}
