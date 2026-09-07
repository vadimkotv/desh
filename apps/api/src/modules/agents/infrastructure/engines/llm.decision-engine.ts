import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { DecisionAction, type DecisionVerdict, DecisionVerdictSchema } from '@agentipo/shared';
import { AppConfig } from '../../../../config/app-config';
import type { DecisionEngine, DecisionInput } from '../../domain/decision-engine.port';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompt.builder';

const DECISION_TOOL: Anthropic.Tool = {
  name: 'submit_decision',
  description: 'Submit the final, mandate-bounded investment decision.',
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: DecisionAction.options },
      amountUsdc: { type: 'number', description: 'USDC to invest; 0 unless action is INVEST' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reasoning: { type: 'string', description: 'Quantitative rationale citing specific findings' },
      keyRisks: { type: 'array', items: { type: 'string' }, maxItems: 10 },
    },
    required: ['action', 'amountUsdc', 'confidence', 'reasoning', 'keyRisks'],
  },
};

// Claude-backed engine using forced tool use so the output is always a valid verdict.
@Injectable()
export class LlmDecisionEngine implements DecisionEngine {
  readonly name: string;
  private readonly log = new Logger(LlmDecisionEngine.name);
  private client?: Anthropic;

  constructor(private readonly config: AppConfig) {
    this.name = `claude:${config.env.ANTHROPIC_MODEL}`;
  }

  available(): boolean {
    return this.config.features.llm;
  }

  async decide(input: DecisionInput): Promise<DecisionVerdict> {
    this.client ??= new Anthropic({ apiKey: this.config.env.ANTHROPIC_API_KEY });
    const response = await this.client.messages.create({
      model: this.config.env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [DECISION_TOOL],
      tool_choice: { type: 'tool', name: DECISION_TOOL.name },
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    });
    const call = response.content.find((b) => b.type === 'tool_use');
    if (!call || call.type !== 'tool_use') throw new Error('Claude did not call submit_decision');

    const verdict = DecisionVerdictSchema.parse(call.input);
    const bounded = { ...verdict, amountUsdc: verdict.action === 'INVEST' ? Math.min(verdict.amountUsdc, input.maxAmountUsdc) : 0 };
    this.log.log(`${this.name} → ${bounded.action} ${bounded.amountUsdc} USDC (conf ${bounded.confidence})`);
    return bounded;
  }
}
