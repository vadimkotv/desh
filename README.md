# AgentIPO

**Autonomous underwriting for revenue-based startup financing: the investor is an AI agent bound by a human mandate, capital sits in programmable escrow, and repayment is enforced by code.**

Founders publish a round with a verifiable data room. Investor agents (owned by humans who write a
*mandate*, never a buy order) buy due-diligence data per query over **x402 on Hedera**, reason over
**live on-chain signals indexed by The Graph**, and settle USDC into a milestone escrow on **Arc**.
Every decision is written to a **Hedera Consensus Service** topic, and every agent has an
**ERC-8004** identity so its track record is public.

**What investors get:** not a token and not a promise of an exit. Each round carries a *return cap*
(e.g. 1.5×). Once funded, the startup routes revenue into the escrow and agents `claim` their pro-rata
share until the cap is reached — revenue-based financing (the Pipe/Clearco model) with on-chain data
instead of PDFs and code instead of covenants.

Built for ETHGlobal ETHOnline 2026 · tracks: The Graph, Arc (Circle), Hedera.

```
founder ──► round + data room ──► The Graph (Token API · Messari DEX · Agent0)
                                       │
                                       ▼
agent ──► x402 pays for report ──► due-diligence engine ──► Claude / rules ──► spending policy
                (Hedera)                                                            │
                                                                                    ▼
                                             HCS audit ◄── RoundEscrow.invest(USDC) on Arc
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

Then: open http://localhost:3000 → press **Run swarm** on a round: three seeded agents with different mandates buy the report, decide and settle live (SSE). Rounds have no
on-chain escrow yet, so settlements are recorded as `FAILED: round has no on-chain escrow id` —
that is the honest degraded mode. Add keys and the same code path goes live:

| Add to `.env` | What turns on |
| --- | --- |
| `GRAPH_TOKEN_API_JWT` | Token API provider: holders, transfers, treasury balances |
| `GRAPH_GATEWAY_API_KEY` (+ `GRAPH_MESSARI_DEX_SUBGRAPH_ID`) | Agent0/ERC-8004 reputation + Messari standardized DEX liquidity |
| `ARC_ESCROW_ADDRESS` + `ARC_PLATFORM_PRIVATE_KEY` | Rounds are created in `RoundEscrow` on Arc testnet; agents invest real USDC |
| `HEDERA_OPERATOR_ID/KEY` + `HEDERA_PAYTO_ACCOUNT_ID` | x402 paywall via Blocky402, agent Hedera accounts, HCS audit topic |
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
| `packages/contracts` | Foundry: `RoundEscrow.sol` (target-or-refund, milestone release, revenue-share `distribute`/`claim` up to a cap) + 48 tests. |
| `ARCHITECTURE.md` | Module map, agent pipeline, REST surface, track mapping. |
| `docs/` | Demo script, submission notes per track, setup for each sponsor. |

## The whole story in one command

```bash
pnpm --filter @agentipo/api demo:flow        # round → swarm waves → finalize → milestones → revenue → claims
```

## Commands

```bash
pnpm typecheck · pnpm lint · pnpm test · pnpm check:file-size · pnpm contracts:test
pnpm --filter @agentipo/api agent:run <agentId> [roundId]     # run an agent from the CLI
```

## Design rules

- **One reason to change per file, ≤ 100 lines** — enforced by ESLint `max-lines` and `scripts/check-file-size.mjs`.
- **Domain is framework-free**: evaluators, spending policy, mandate gate are pure functions with Vitest specs.
- **Adapters are optional**: each sponsor integration registers only when its credentials exist; the API never crashes because a key is missing.
- **Money is bounded twice**: the spending policy computes a ceiling *before* the LLM sees the deal, and the verdict is clamped again *after*.
