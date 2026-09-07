import type { Signal } from '@agentipo/shared';

// Read-only lookup over a signal set; evaluators receive this instead of raw arrays.
export class SignalMap {
  private readonly byKey = new Map<string, Signal>();

  constructor(signals: Signal[]) {
    for (const s of signals) this.byKey.set(s.key, s);
  }

  get(key: string): number | undefined {
    return this.byKey.get(key)?.value;
  }

  has(...keys: string[]): boolean {
    return keys.every((k) => this.byKey.has(k));
  }

  missing(keys: string[]): string[] {
    return keys.filter((k) => !this.byKey.has(k));
  }

  all(): Signal[] {
    return [...this.byKey.values()];
  }
}
