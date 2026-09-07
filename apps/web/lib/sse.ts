import { RunEventSchema, RunEventType, type RunEvent } from '@agentipo/shared';

export type SseStatus = 'connecting' | 'open' | 'closed' | 'error';

type Handlers = {
  onEvent: (event: RunEvent) => void;
  onStatus?: (status: SseStatus) => void;
};

// The API sends typed SSE messages (`event: run.started` …), so `onmessage`
// never fires; we attach one listener per RunEventType and validate each payload
// with the shared zod schema. Returns an unsubscribe function.
export function subscribeRunEvents(url: string, { onEvent, onStatus }: Handlers): () => void {
  const source = new EventSource(url);
  let completed = false;
  onStatus?.('connecting');

  const handle = (raw: MessageEvent<string>) => {
    try {
      const parsed = RunEventSchema.safeParse(JSON.parse(raw.data));
      if (!parsed.success) return;
      onEvent(parsed.data);
      if (parsed.data.type === 'run.completed') completed = true;
    } catch {
      // malformed frame — ignore, the stream is replayable
    }
  };

  for (const type of RunEventType.options) source.addEventListener(type, handle);
  source.onopen = () => onStatus?.('open');
  source.onerror = () => {
    // After run.completed the server closes the stream; that is not an error.
    if (completed) {
      source.close();
      onStatus?.('closed');
      return;
    }
    onStatus?.(source.readyState === EventSource.CLOSED ? 'closed' : 'error');
  };

  return () => {
    source.close();
    onStatus?.('closed');
  };
}
