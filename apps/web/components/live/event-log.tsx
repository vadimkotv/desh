import type { RunEvent } from '@agentipo/shared';
import { ExternalLink } from '@/components/ui/external-link';
import { describeEvent, type EventTone } from '@/lib/event-text';
import { formatTime } from '@/lib/format';

const tones: Record<EventTone, string> = {
  muted: 'text-muted',
  accent: 'text-accent',
  agent: 'text-agent',
  amber: 'text-amber',
  danger: 'text-danger',
  info: 'text-info',
};

type EventLogProps = { events: RunEvent[]; limit?: number };

// Compact terminal-style log: time · type · key payload. Newest at the bottom,
// each line fades in as it is released by the pacer.
export function EventLog({ events, limit = 14 }: EventLogProps) {
  const visible = events.slice(-limit);
  return (
    <ol className="flex flex-col gap-[3px] font-mono text-[10.5px] leading-snug">
      {visible.map((event) => {
        const view = describeEvent(event);
        return (
          <li key={event.id} className="fade-in grid grid-cols-[52px_1fr] gap-2">
            <span className="num text-dim">{formatTime(event.at).slice(0, 8)}</span>
            <span className="min-w-0">
              <span className={`mr-1.5 ${tones[view.tone]}`}>{event.type}</span>
              <span className="text-fg/80">{view.text}</span>
              {view.link && (
                <span className="ml-1.5">
                  <ExternalLink href={view.link.href}>{view.link.label}</ExternalLink>
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
