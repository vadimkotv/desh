import type { Mandate } from '@agentipo/shared';
import { LabeledMeter } from '@/components/charts/meter';
import { bpsToPercent, num, percent } from '@/lib/format';

type MandateBarsProps = { mandate: Mandate; compact?: boolean };

// Reference ceilings so bars are comparable across agents (max ticket 1k, daily 2k, data 5).
const SCALE = { ticket: 1_000, daily: 2_000, data: 5 };

// The mandate as labeled bars: every number the agent is bounded by, at a glance.
export function MandateBars({ mandate, compact = false }: MandateBarsProps) {
  return (
    <div className={compact ? 'grid gap-2' : 'grid gap-3 sm:grid-cols-2'}>
      <LabeledMeter label="min DD score" valueText={`${mandate.minScore} / 100`} value={mandate.minScore} tone="agent" marker={mandate.minScore} />
      <LabeledMeter label="max ticket" valueText={`${num(mandate.maxTicketUsdc)} USDC`} value={percent(mandate.maxTicketUsdc, SCALE.ticket)} tone="accent" />
      <LabeledMeter label="per-round share" valueText={bpsToPercent(mandate.maxPerRoundShareBps)} value={mandate.maxPerRoundShareBps / 100} tone="accent" />
      <LabeledMeter label="daily budget" valueText={`${num(mandate.dailyBudgetUsdc)} USDC`} value={percent(mandate.dailyBudgetUsdc, SCALE.daily)} tone="accent" />
      {!compact && (
        <LabeledMeter label="data spend cap" valueText={`${num(mandate.maxDataSpendUsdc)} USDC`} value={percent(mandate.maxDataSpendUsdc, SCALE.data)} tone="warn" />
      )}
    </div>
  );
}
