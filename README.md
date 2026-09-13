# AgentIPO

**Startup fundraising where the investor is an AI agent bound by a human mandate, capital sits in
programmable escrow, and the payout is enforced by code.**

Founders publish a round with a verifiable data room. Investor agents — owned by humans who write a
*mandate*, never a buy order — reason over **live on-chain signals indexed by The Graph**, ask the
founder for whatever is not public, and settle USDC into a milestone escrow on **Arc**. Every
decision is written to a **Hedera Consensus Service** topic, and every agent carries an **ERC-8004**
identity, so its track record is public.

**What investors buy:** equity. A round sells a stake (`equityBps`), which fixes the price —
`raised × 10 000 / equityBps` is the valuation it was struck at. Capital comes back only on a
**liquidity event**: acquisition, IPO, TGE or a contract payout. Whoever settles the exit pays
proceeds into the escrow and every investor claims their pro-rata share, uncapped. No revenue share,
no repayment schedule, nothing to service — the same shape as a normal seed round, with on-chain
data instead of PDFs and an escrow instead of covenants.

**Two things the platform does not do:** it does not charge agents to look (research on public
evidence is free — founders gate their *own* numbers and open them to the agents they choose), and
it does not force full autonomy (an agent can be `ADVISORY`: identical research, but a human presses
the final invest button).

Built for ETHGlobal ETHOnline 2026 · tracks: The Graph, Arc (Circle), Hedera.

```
founder ──► round + data room ──► The Graph (Token API · Messari DEX · Agent0)
                                       │
                                       ▼
agent ──► free report + founder metrics ──► due-diligence engine ──► Claude / rules ──► spending policy
             (asks for gated ones)                  (growth = slope)                        │
                                                                     AUTONOMOUS ────────────┤
                                                                     ADVISORY ──► human ────┤
                                                                                            ▼
                                             HCS audit ◄── RoundEscrow.invest(USDC) on Arc
                                                                                            │
                                            acquisition / IPO / TGE / contract ──► settleExit ──► claim
```

## Onboarding

A person signs in through **Privy**, says whether they are raising or investing, and
lands with something real: a founder finishes with a listed startup whose metrics are
already a trajectory, an investor finishes with a working agent under their mandate.

Without `PRIVY_APP_ID` the same three screens run on a local session that is labelled
**demo** everywhere it appears — in the nav pill, on the sign-in step, and in the
account record the API stores — so a screenshot can never imply a verified login.

```
/onboarding → sign in ─► pick a side ─┬─ founder: name, logo, links, contracts, token,
                                      │           and metrics as a monthly series with
                                      │           a "gated" switch per row
                                      └─ investor: mandate + autonomous or advisory
```

## Quick start

```bash
pnpm setup                      # install, build shared, generate Prisma client
cp .env.example .env            # fill what you have — every integration is optional
pnpm db:up                      # Postgres via docker compose
pnpm db:migrate                 # apply migrations
pnpm db:seed                    # 3 demo startups + rounds
pnpm dev                        # API :4000 (Swagger at /docs) + web :3000
```

Minimal `.env` to see the whole loop without any sponsor keys:

```
DATABASE_URL=postgresql://agentipo:agentipo@localhost:5432/agentipo
AGENT_MASTER_MNEMONIC="test test test test test test test test test test test junk"
DEMO_SIGNALS=true               # deterministic fixture signals instead of The Graph
```

Then: open http://localhost:3000 → press **Run** on an agent and it starts watching for rounds that
match its mandate in the background; **Run swarm** on a round puts every agent on it at once. Three
seeded agents settle autonomously, a fourth (`Atlas`) files a proposal for you to approve. Rounds have no
on-chain escrow yet, so settlements are recorded as `FAILED: round has no on-chain escrow id` —
that is the honest degraded mode. Add keys and the same code path goes live:

| Add to `.env` | What turns on |
| --- | --- |
| `GRAPH_TOKEN_API_JWT` | Token API provider: holders, transfers, treasury balances |
| `GRAPH_GATEWAY_API_KEY` (+ `GRAPH_MESSARI_DEX_SUBGRAPH_ID`) | Agent0/ERC-8004 reputation + Messari standardized DEX liquidity |
| `ARC_ESCROW_ADDRESS` + `ARC_PLATFORM_PRIVATE_KEY` | Rounds are created in `RoundEscrow` on Arc testnet; agents invest real USDC |
| `HEDERA_OPERATOR_ID/KEY` + `HEDERA_PAYTO_ACCOUNT_ID` | Agent Hedera accounts, HCS audit topic; with `X402_GATE_REPORTS=true` also the x402 report paywall via Blocky402 |
| `CIRCLE_API_KEY/ENTITY_SECRET/WALLET_SET_ID` | `CIRCLE` wallet kind → Circle developer-controlled wallets on `ARC-TESTNET` |
| `ANTHROPIC_API_KEY` | Claude decision engine (forced tool-use, mandate-bounded) instead of rules |

`GET /health` reports which features are live. Unset `DEMO_SIGNALS` once Graph keys are present.

## Local end-to-end without testnets

Two dev helpers let you exercise every code path offline (both are used in CI-style smoke runs):

```bash
# Arc stand-in: anvil with Arc's chain id, MockUSDC placed at the native USDC address
anvil --chain-id 5042002 &
# deploy packages/contracts (see its README), set ARC_RPC_URL=http://127.0.0.1:8545, ARC_ESCROW_ADDRESS, ARC_PLATFORM_PRIVATE_KEY

# x402 stand-in: a facilitator that accepts every payment (dev only)
pnpm --filter @agentipo/api dev:facilitator-stub     # → X402_FACILITATOR_URL=http://localhost:3999
```

## Repository

| Path | What |
| --- | --- |
| `apps/api` | NestJS 11 platform. Ports & adapters per module, every file ≤ 100 lines. |
| `apps/web` | Next.js 16 **command center**: live SSE pipeline (buy data → gate → policy → engine → settle), swarm runs, radar/sparkline charts, honest provenance badges. Screens in `docs/screens/`. |
| `packages/shared` | zod contracts + chain constants shared by API and web. |
| `packages/contracts` | Foundry: `RoundEscrow.sol` (target-or-refund, milestone release, `settleExit`/`claim` on a liquidity event) + 52 tests. |
| `ARCHITECTURE.md` | Module map, agent pipeline, REST surface, track mapping. |
| `docs/` | Demo script, submission notes per track, setup for each sponsor. |

## The whole story in one command

```bash
pnpm --filter @agentipo/api demo:flow        # round → swarm → human approves → finalize → milestones → exit → claims
```

## Commands

```bash
pnpm typecheck · pnpm lint · pnpm test · pnpm check:file-size · pnpm contracts:test
pnpm --filter @agentipo/api agent:run <agentId> [roundId]     # run an agent from the CLI
pnpm --filter @agentipo/api dev:fund-agents                   # top up agent wallets (USDC + gas) on a local fork
```

## Design rules

- **One reason to change per file, ≤ 100 lines** — enforced by ESLint `max-lines` and `scripts/check-file-size.mjs`.
- **Domain is framework-free**: evaluators, spending policy, mandate gate are pure functions with Vitest specs.
- **Adapters are optional**: each sponsor integration registers only when its credentials exist; the API never crashes because a key is missing.
- **Money is bounded twice**: the spending policy computes a ceiling *before* the LLM sees the deal, and the verdict is clamped again *after*. Approving a proposal re-runs that policy, because the world moves between the proposal and the click.
- **Missing data is never zero**: a withheld metric, an unreadable index and a single reading with no trajectory all land as `unknown`, which lowers *coverage* instead of inventing a score.
