import type { Signal, SignalSource, Startup } from '@agentipo/shared';

export const DATA_PROVIDERS = Symbol('DATA_PROVIDERS');

export interface StartupContext {
  startup: Startup;
}

// A DataProvider turns one external data source into normalized Signals.
// Adding a source = adding one adapter; nothing downstream changes.
export interface DataProvider {
  readonly source: SignalSource;
  supports(ctx: StartupContext): boolean;
  collect(ctx: StartupContext): Promise<Signal[]>;
}

export const signal = (
  source: SignalSource,
  key: string,
  value: number,
  unit?: string,
  meta?: Record<string, unknown>,
): Signal => ({ key, value, unit, source, observedAt: new Date().toISOString(), meta });
