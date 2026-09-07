import { API_URL } from '@/lib/api';

type EmptyStateProps = {
  title: string;
  hint?: string;
};

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <p className="font-mono text-sm text-fg">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

// Rendered whenever the API cannot be reached (connection refused, DNS, etc).
export function ApiOffline() {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/5 px-6 py-10 text-center">
      <p className="font-mono text-sm text-danger">▲ API offline</p>
      <p className="mt-1 text-xs text-muted">
        Could not reach <span className="font-mono text-fg">{API_URL}</span>. Start the API with{' '}
        <span className="font-mono text-fg">pnpm dev:api</span> and reload.
      </p>
    </div>
  );
}
