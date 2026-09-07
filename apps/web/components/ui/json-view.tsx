import { Collapsible } from './collapsible';

type JsonViewProps = { value: unknown; label?: string; defaultOpen?: boolean };

export function JsonView({ value, label = 'payload', defaultOpen = false }: JsonViewProps) {
  return (
    <Collapsible label={label} defaultOpen={defaultOpen}>
      <pre className="max-h-72 overflow-auto rounded border border-line bg-ink p-3 font-mono text-[11px] leading-relaxed text-fg">
        {JSON.stringify(value, null, 2)}
      </pre>
    </Collapsible>
  );
}
