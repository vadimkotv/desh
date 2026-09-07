import type { Signal, SignalSource } from '@agentipo/shared';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { formatDate, signalValue } from '@/lib/format';

const sourceTone: Record<SignalSource, BadgeTone> = {
  'graph-token-api': 'info',
  'graph-messari-dex': 'info',
  'graph-agent0': 'info',
  'onchain-arc': 'accent',
  github: 'neutral',
  'demo-fixture': 'amber',
};

type SignalsTableProps = { signals: Signal[] };

export function SignalsTable({ signals }: SignalsTableProps) {
  return (
    <Panel eyebrow="data room" title="Signals" action={<span className="font-mono text-[11px] text-muted">{signals.length} observed</span>}>
      {signals.length === 0 ? (
        <p className="text-xs text-muted">No signals collected yet. Use “Refresh data room”.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left font-mono text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-2 pr-3 font-normal">key</th>
                <th className="pb-2 pr-3 text-right font-normal">value</th>
                <th className="pb-2 pr-3 font-normal">source</th>
                <th className="pb-2 font-normal">observed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {signals.map((signal) => (
                <tr key={`${signal.source}:${signal.key}`} className="align-top">
                  <td className="py-2 pr-3 text-fg">{signal.key}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-accent">
                    {signalValue(signal.value, signal.unit)}
                    {signal.unit && !['usd', 'bps', 'days'].includes(signal.unit) && (
                      <span className="ml-1 text-muted">{signal.unit}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3"><Badge tone={sourceTone[signal.source] ?? 'neutral'}>{signal.source}</Badge></td>
                  <td className="py-2 text-muted">{formatDate(signal.observedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
