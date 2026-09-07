import { Stat } from '@/components/ui/stat';
import { num, usdcCompact } from '@/lib/format';

type StatsRowProps = {
  openRounds: number;
  totalRaisedUsdc: number;
  agents: number;
  decisions: number | null;
};

export function StatsRow({ openRounds, totalRaisedUsdc, agents, decisions }: StatsRowProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Open rounds" value={num(openRounds)} hint="accepting agent capital" />
      <Stat label="Total raised" value={usdcCompact(totalRaisedUsdc)} hint="USDC in Arc escrow" />
      <Stat label="Agents" value={num(agents)} hint="mandate-bound investors" />
      <Stat
        label="Decisions"
        value={decisions === null ? '—' : num(decisions)}
        hint={decisions === null ? 'feed unavailable' : 'audited to Hedera HCS'}
      />
    </div>
  );
}
