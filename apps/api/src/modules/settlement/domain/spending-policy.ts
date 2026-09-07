import type { Mandate, Round } from '@agentipo/shared';
import { bpsOf, round6 } from '../../../common/money';

export interface SpendContext {
  mandate: Mandate;
  round: Pick<Round, 'targetUsdc' | 'raisedUsdc' | 'minTicketUsdc'>;
  proposedUsdc: number;
  spentTodayUsdc: number;
  walletBalanceUsdc?: number;
}

export interface SpendVerdict {
  allowed: boolean;
  amountUsdc: number;
  reason: string;
}

// Pure, framework-free policy. Mirrors Circle Agent Wallet spending policies
// (global limits, per-service caps) but is enforced in-domain before any tx is built.
export function evaluateSpend(ctx: SpendContext): SpendVerdict {
  const { mandate, round, proposedUsdc, spentTodayUsdc, walletBalanceUsdc } = ctx;
  if (proposedUsdc <= 0) return deny('proposed amount is zero');

  const caps: Array<[number, string]> = [
    [mandate.maxTicketUsdc, 'mandate.maxTicketUsdc'],
    [bpsOf(round.targetUsdc, mandate.maxPerRoundShareBps), 'mandate.maxPerRoundShareBps'],
    [Math.max(0, mandate.dailyBudgetUsdc - spentTodayUsdc), 'mandate.dailyBudgetUsdc'],
  ];
  if (walletBalanceUsdc !== undefined) caps.push([walletBalanceUsdc, 'wallet balance']);

  let amount = proposedUsdc;
  const applied: string[] = [];
  for (const [cap, label] of caps) {
    if (amount > cap) {
      amount = cap;
      applied.push(label);
    }
  }
  amount = round6(amount);

  if (amount < round.minTicketUsdc) {
    return deny(`amount ${amount} below round minimum ticket ${round.minTicketUsdc}`);
  }
  const reason = applied.length ? `clamped by ${applied.join(', ')}` : 'within mandate';
  return { allowed: true, amountUsdc: amount, reason };
}

const deny = (reason: string): SpendVerdict => ({ allowed: false, amountUsdc: 0, reason });
