import type { DecisionInput } from '../../domain/decision-engine.port';

export const SYSTEM_PROMPT = `You are an autonomous venture investment agent operating on AgentIPO.
You act ONLY within the human-authored mandate you are given. You never exceed the USDC ceiling.
You reason from the due-diligence report, which is built from live on-chain data indexed by The Graph
(Token API holder/transfer data, Messari standardized DEX liquidity, ERC-8004 reputation) and from the
Arc escrow state. Treat "unknown" findings as missing evidence, not as neutral facts.
Be concise, specific and quantitative. Prefer PASS over a weakly justified INVEST.
You must answer by calling the submit_decision tool exactly once.`;

export function buildUserPrompt(input: DecisionInput): string {
  const { mandate, round, report, maxAmountUsdc, selfReputation } = input;
  const s = round.startup;
  const findings = report.findings
    .map((f) => `- ${f.category} [${f.verdict}, score ${f.score}, weight ${f.weight}]: ${f.rationale}`)
    .join('\n');
  const signals = report.signals.map((x) => `- ${x.key} = ${x.value}${x.unit ? ' ' + x.unit : ''} (${x.source})`).join('\n');
  const rep = selfReputation
    ? `Your own ERC-8004 reputation: ${selfReputation.totalFeedback} feedback entries, average ${selfReputation.averageScore ?? 'n/a'}.`
    : 'You have no ERC-8004 reputation yet; a careless investment will define it.';

  return [
    `## Mandate\nThesis: ${mandate.thesis}\nSectors: ${mandate.sectors.join(', ')}\nRisk tolerance: ${mandate.riskTolerance}\nMinimum score: ${mandate.minScore}`,
    `USDC ceiling for THIS decision (already policy-bounded): ${maxAmountUsdc}`,
    `## Round\nStartup: ${s.name} (${s.sector})\n${s.description}\nTarget: ${round.targetUsdc} USDC, raised so far: ${round.raisedUsdc} USDC, min ticket: ${round.minTicketUsdc}\nDeadline: ${round.deadline}\nReturn model: revenue share, investors repaid pro-rata from revenue up to ${round.returnCapBps / 100}% of principal (cap)\nMilestones: ${round.milestones.map((m) => `${m.title} (${m.releaseBps / 100}%)`).join('; ')}`,
    `## Due-diligence report\nComposite score: ${report.score}/100, data coverage: ${report.dataCoverage}\n${report.summary}\n\nFindings:\n${findings}\n\nRaw signals:\n${signals}`,
    `## Context\n${rep}`,
    `Decide: INVEST (with amountUsdc in (0, ${maxAmountUsdc}]), WATCH, or PASS.`,
  ].join('\n\n');
}
