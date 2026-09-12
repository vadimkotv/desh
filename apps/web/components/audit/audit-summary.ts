import type { AuditEntry } from '@agentipo/shared';
import { num, shortAddress } from '@/lib/format';

const s = (v: unknown): string => (typeof v === 'string' ? v : '');
const n = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

// One-line digest of an audit payload, so the timeline reads without opening JSON.
export function auditSummary(entry: AuditEntry): string {
  const p = entry.payload;
  switch (entry.kind) {
    case 'AGENT_REGISTERED':
      return `registered${s(p.name) ? ` ${s(p.name)}` : ''}${s(p.walletAddress) ? ` · wallet ${shortAddress(s(p.walletAddress))}` : ''}`;
    case 'DATA_PURCHASED':
      return `bought premium report${s(p.txId) ? ` · tx ${s(p.txId)}` : ''}`;
    case 'DECISION_MADE':
      return `${s(p.action)}${n(p.amountUsdc) > 0 ? ` ${num(n(p.amountUsdc))} USDC` : ''} via ${s(p.engine) || 'engine'}`;
    case 'INVESTMENT_SUBMITTED':
      return `submitted ${num(n(p.amountUsdc))} USDC to escrow`;
    case 'INVESTMENT_CONFIRMED':
      return `confirmed on chain ${n(p.chainId)}${s(p.txHash) ? ` · ${shortAddress(s(p.txHash), 6)}` : ''}`;
    case 'INVESTMENT_FAILED':
      return `settlement failed · ${s(p.error) || (s(p.txHash) ? `tx ${shortAddress(s(p.txHash), 6)}` : 'no tx hash')}`;
    case 'ROUND_FINALIZED':
      return `⚑ round finalized · ${num(n(p.raisedUsdc))} USDC locked in escrow #${n(p.onchainId)}`;
    case 'MILESTONE_RELEASED':
      return `⛳ milestone ${n(p.index) + 1} “${s(p.milestone)}” released to founder`;
    case 'EXIT_SETTLED':
      return `★ ${s(p.kind).toLowerCase()} settled · ${num(n(p.proceedsUsdc))} USDC to investors · pool ${num(n(p.proceedsPoolUsdc))} · ${s(p.status)}`;
    case 'RETURN_CLAIMED':
      return `↑ claimed ${num(n(p.claimedUsdc))} USDC of exit proceeds · ${num(n(p.totalClaimedUsdc))} total`;
    default:
      return entry.kind;
  }
}
