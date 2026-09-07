import { Inject, Injectable } from '@nestjs/common';
import { AppConfig } from '../../../../config/app-config';
import { DECISION_ENGINES, type DecisionEngine } from '../../domain/decision-engine.port';

// Picks the engine: explicit via DECISION_ENGINE, or "auto" = LLM when a key exists, else rules.
@Injectable()
export class DecisionEngineResolver {
  constructor(
    @Inject(DECISION_ENGINES) private readonly engines: DecisionEngine[],
    private readonly config: AppConfig,
  ) {}

  resolve(): DecisionEngine {
    const preference = this.config.env.DECISION_ENGINE;
    const wanted = preference === 'auto' ? ['claude', 'rules'] : [preference === 'llm' ? 'claude' : 'rules'];
    for (const prefix of wanted) {
      const engine = this.engines.find((e) => e.name.startsWith(prefix) && e.available());
      if (engine) return engine;
    }
    throw new Error(`No decision engine available for preference "${preference}"`);
  }
}
