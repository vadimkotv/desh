import type { RunEvent } from '@agentipo/shared';
import { atomicUsdc, num, shortAddress } from './format';
import { hederaTxUrl, settlementTxUrl } from './links';

export type EventTone = 'muted' | 'accent' | 'agent' | 'amber' | 'danger' | 'info';
export type EventLineView = { text: string; tone: EventTone; link?: { href: string; label: string } };

const s = (v: unknown): string => (typeof v === 'string' ? v : '');
const n = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

// One-line, human-readable description of a RunEvent's key payload fields.
export function describeEvent(e: RunEvent): EventLineView {
  const p = e.payload;
  switch (e.type) {
    case 'run.started':
      return { text: `run started · sectors ${Array.isArray(p.sectors) ? p.sectors.join(', ') : '—'}`, tone: 'agent' };
    case 'round.discovered':
      return { text: `round ${s(p.startup)} · ${num(n(p.raisedUsdc))}/${num(n(p.targetUsdc))} USDC raised`, tone: 'info' };
    case 'data.purchasing':
      return { text: `x402 · requesting premium report · payer ${s(p.payer) || '—'}`, tone: 'amber' };
    case 'data.purchased': {
      const paid = s(p.amount) ? `paid ${num(atomicUsdc(s(p.amount)))} USDC on Hedera` : 'paid via x402 on Hedera';
      const tx = s(p.txId);
      return { text: `${paid} · report score ${num(n(p.score))}`, tone: 'amber', link: tx ? { href: hederaTxUrl(tx), label: 'hashscan' } : undefined };
    }
    case 'gate.passed':
      return { text: `mandate gate passed · score ${num(n(p.score))} ≥ min ${num(n(p.minScore))}`, tone: 'accent' };
    case 'gate.failed':
      return { text: `mandate gate failed · ${s(p.reason)} (score ${num(n(p.score))} < ${num(n(p.minScore))})`, tone: 'danger' };
    case 'policy.evaluated':
      return { text: `spending policy · ceiling ${num(n(p.ceilingUsdc))} USDC · ${s(p.reason)}`, tone: p.allowed === false ? 'danger' : 'info' };
    case 'engine.deciding':
      return { text: `${s(p.engine)} deciding · max ${num(n(p.maxAmountUsdc))} USDC`, tone: 'agent' };
    case 'engine.decided':
      return { text: `${s(p.engine)} → ${s(p.action)} ${n(p.amountUsdc) > 0 ? `${num(n(p.amountUsdc))} USDC` : ''}`.trim(), tone: 'agent' };
    case 'settlement.submitted':
      return { text: `submitting ${num(n(p.amountUsdc))} USDC from ${shortAddress(s(p.wallet) || '—')} (${s(p.kind)})`, tone: 'info' };
    case 'settlement.confirmed': {
      const hash = s(p.txHash);
      return { text: `settled ${num(n(p.amountUsdc))} USDC into Arc escrow`, tone: 'accent', link: hash ? { href: settlementTxUrl(n(p.chainId), hash), label: 'arcscan' } : undefined };
    }
    case 'settlement.failed':
      return { text: `settlement failed · ${s(p.error) || 'no tx hash'}`, tone: 'danger' };
    case 'round.done':
      return { text: `round done · ${s(p.action)}${n(p.amountUsdc) > 0 ? ` ${num(n(p.amountUsdc))} USDC` : ''}`, tone: 'muted' };
    case 'round.failed':
      return { text: `round failed · ${s(p.error)}`, tone: 'danger' };
    case 'run.completed':
      return { text: `run completed · ${n(p.decisions)} decision(s) · ${n(p.invested)} invested`, tone: 'muted' };
    default:
      return { text: e.type, tone: 'muted' };
  }
}
