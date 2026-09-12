import type { AgentMode, ApprovalState, DecisionAction } from '@agentipo/shared';

// Whether a verdict needs a human before money moves. Only a real ticket does: an
// advisory agent's PASS or WATCH is a note, not something anyone has to sign off.
export function approvalFor(mode: AgentMode, action: DecisionAction): ApprovalState {
  return mode === 'ADVISORY' && action === 'INVEST' ? 'PENDING' : 'NOT_REQUIRED';
}

// A proposal is only actionable while it is still pending; approving or rejecting
// twice must not move money twice.
export const isActionable = (approval: ApprovalState): boolean => approval === 'PENDING';
