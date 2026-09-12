import type { Agent, Decision } from '@agentipo/shared';
import { SectionLabel } from '@/components/ui/panel';
import type { RoundDetail } from '@/lib/types';
import { ApprovalRow } from './approval-row';

type ApprovalQueueProps = {
  proposals: Decision[];
  rounds: Map<string, RoundDetail>;
  agents: Map<string, Agent>;
};

// Proposals from advisory agents. Nothing here has moved money: the research is done,
// the ticket is sized, and the round is still open — a human has to press the button.
export function ApprovalQueue({ proposals, rounds, agents }: ApprovalQueueProps) {
  if (proposals.length === 0) return null;
  const total = proposals.reduce((sum, p) => sum + p.amountUsdc, 0);
  return (
    <section>
      <SectionLabel right={`${proposals.length} waiting · ${total.toFixed(2)} USDC proposed`}>
        <span className="text-amber">Needs your approval</span>
      </SectionLabel>
      <ul className="flex flex-col gap-2">
        {proposals.map((proposal) => (
          <ApprovalRow
            key={proposal.id}
            proposal={proposal}
            round={rounds.get(proposal.roundId)}
            agent={agents.get(proposal.agentId)}
          />
        ))}
      </ul>
    </section>
  );
}
