import type { Signal, SignalSource } from '@agentipo/shared';
import { Panel } from '@/components/ui/panel';
import { formatDate, signalValue } from '@/lib/format';
import { ProvenanceBadge } from './provenance-badge';

const groupBySource = (signals: Signal[]): [SignalSource, Signal[]][] => {
  const groups = new Map<SignalSource, Signal[]>();
  for (const s of signals) groups.set(s.source, [...(groups.get(s.source) ?? []), s]);
  return [...groups.entries()];
};

export function SignalsTable({ signals }: { signals: Signal[] }) {
  const groups = groupBySource(signals);
  return (
    <Panel eyebrow="data room" title="Signals" action={<span className="font-mono text-[10.5px] text-muted">{signals.length} observed</span>} bodyClassName="p-0">
      {signals.length === 0 ? (
        <p className="p-4 text-[12px] text-muted">No signals collected yet. Use “Refresh” above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left font-mono text-[11px]">
            <thead className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2 font-normal">key</th>
                <th className="py-2 pr-3 text-right font-normal">value</th>
                <th className="py-2 pr-3 font-normal">unit</th>
                <th className="py-2 pr-4 font-normal">observed</th>
              </tr>
            </thead>
            {groups.map(([source, rows]) => (
              <tbody key={source} className="border-b border-line last:border-0">
                <tr className="bg-raised/50">
                  <td colSpan={4} className="px-4 py-1.5">
                    <ProvenanceBadge source={source} />
                    <span className="ml-2 text-[10px] text-dim">{rows.length} signals</span>
                  </td>
                </tr>
                {rows.map((signal) => (
                  <tr key={`${signal.source}:${signal.key}`} className="border-t border-line/60 transition-colors hover:bg-hover">
                    <td className="px-4 py-1.5 text-fg">{signal.key}</td>
                    <td className="num py-1.5 pr-3 text-right text-bright">{signalValue(signal.value, signal.unit)}</td>
                    <td className="py-1.5 pr-3 text-dim">{signal.unit ?? '—'}</td>
                    <td className="py-1.5 pr-4 text-muted">{formatDate(signal.observedAt)}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </Panel>
  );
}
