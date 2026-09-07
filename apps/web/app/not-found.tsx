import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg">
      <EmptyState title="404 · nothing here" hint="The resource you asked for does not exist." />
      <p className="mt-4 text-center">
        <Link href="/" className="font-mono text-xs text-accent hover:underline">
          ← back to the command center
        </Link>
      </p>
    </div>
  );
}
