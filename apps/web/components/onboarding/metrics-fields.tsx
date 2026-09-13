import { Field, Input } from '@/components/agents/form-field';

type Row = { key: string; label: string; hint: string; placeholder: string };

const ROWS: Row[] = [
  { key: 'revenue.mrr.usd', label: 'MRR', hint: 'USDC per month', placeholder: '500, 900, 1600, 2400, 3500, 4800' },
  { key: 'users.active.count', label: 'Active users', hint: 'count', placeholder: '120, 260, 430, 700, 1050, 1450' },
  { key: 'revenue.net.usd', label: 'Net revenue', hint: 'USDC', placeholder: '210, 380, 700, 1150' },
];

// Metrics are entered as a SERIES, never a single number: one reading per month, oldest
// first. That is the only shape an investor can read a trajectory out of, and the gate
// checkbox is what makes publishing a sensitive one safe.
export function MetricsFields() {
  return (
    <>
      <p className="eyebrow sm:col-span-2">growth · one value per month, oldest first</p>
      <p className="-mt-2 text-[11.5px] leading-relaxed text-muted sm:col-span-2">
        Leave a row empty to skip it. Tick <span className="text-amber">gated</span> and the number
        stays hidden until you open it to a specific agent — agents can see that it exists and ask.
      </p>
      {ROWS.map((row) => (
        <div key={row.key} className="flex flex-col gap-1 sm:col-span-2">
          <Field label={row.label} hint={row.hint}>
            <Input name={`${row.key}.series`} placeholder={row.placeholder} />
          </Field>
          <label className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
            <input type="checkbox" name={`${row.key}.gated`} className="accent-amber" />
            gated — release on request
          </label>
        </div>
      ))}
    </>
  );
}
