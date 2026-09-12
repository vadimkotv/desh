# AgentIPO — Architecture

> Open-data startup fundraising where the investor is an AI agent bound by a human mandate.
> Founders publish a verifiable data room and gate their own numbers. Agents reason over live
> on-chain signals (The Graph), ask the founder for what is not public, and settle USDC into a
> milestone escrow (Arc). A round sells equity and pays out on a liquidity event.

## 1. System overview

```mermaid
flowchart LR
  subgraph Founder
    F[Founder] -->|registers startup + round| API
  end
  subgraph Platform["AgentIPO API (NestJS)"]
    API[REST API] --> DR[Data Room]
    DR -->|Token API| G1[(The Graph Token API)]
    DR -->|Messari standardized subgraph| G2[(Graph Gateway)]
    DR -->|Agent0 / ERC-8004 subgraph| G2
    DR --> DD[Due Diligence Engine]
    DR --> FM[Founder metrics\npublic or gated]
    AG[Investor Agent Runner] -->|free report + disclosed metrics| DD
    AG -->|asks for gated data| FM
    F -->|grants access| FM
    AG --> DE[Decision Engine\nClaude / rules]
    DE --> SP[Spending Policy]
    SP --> MODE{Agent mode}
    MODE -->|AUTONOMOUS| ST[Settlement]
    MODE -->|ADVISORY| HU[Human approval] --> ST
    AG --> AU[Audit → HCS topic]
    DD -.->|optional X402_GATE_REPORTS| X402[x402 · Hedera via Blocky402]
  end
  ST -->|invest USDC| ESC[(RoundEscrow.sol on Arc)]
  EX[Acquisition · IPO · TGE · Contract] -->|settleExit| ESC
  ESC -->|pro-rata claim| AG
  ST -.->|Circle Agent Wallet| CW[(Circle Dev-Controlled Wallets)]
  AG -->|register identity| ID[(ERC-8004 Identity Registry, Sepolia)]
  WEB[Next.js dashboard] --> API
```

## 2. Sponsor track mapping

| Track | What in the code satisfies it |
| --- | --- |
| The Graph — AI use case (from scratch) | Agents cannot decide without Graph data: `data-room` providers pull live Token API + subgraph data, the `due-diligence` engine turns it into findings, the `agents` decision engine reasons over it. |
| The Graph — composable / standardized | Three Graph products composed: **Token API** (holders, transfers, balances), **Messari standardized DEX schema** (liquidity/volume across any DEX with one query), **Agent0 ERC-8004 subgraph** (identity + reputation). |
| Hedera — AI & agentic payments | Every consequential decision is written to an HCS topic with sequence numbers. Each agent gets its own Hedera account and an ERC-8004 identity. The x402 rail is intact and opt-in: `X402_GATE_REPORTS=true` prices `GET /due-diligence/rounds/:id/premium` and settles it through the Blocky402 facilitator, with the agent signing its own `TransferTransaction`. It is off by default because the platform does not sell its own research — founders gate theirs instead. |
| Arc — agentic economy w/ Circle Agent Stack | Agents hold wallets (local key or Circle developer-controlled wallet on `ARC-TESTNET`), decide from real signals, enforce spending policy, settle USDC into `RoundEscrow`. |
| Arc — DeFi / programmable money | `RoundEscrow.sol`: conditional USDC flows — target-or-refund, milestone-based release to the founder, and an equity payout on a liquidity event (`settleExit` → pro-rata `claim`, uncapped). An exit freezes the milestone schedule and returns undrawn escrow to investors. |

## 3. Monorepo layout

```
apps/api            NestJS 11 — the platform (modules below)
apps/web            Next.js 16 dashboard (server components, reads the API)
packages/shared     zod schemas + chain constants shared by api & web
packages/contracts  Foundry — RoundEscrow.sol + tests + deploy script (Arc testnet)
```

## 4. API module structure (ports & adapters)

Every module follows the same four folders. Domain never imports Nest or Prisma.

```
modules/<name>/
  domain/          entities, value objects, ports (interfaces) + DI tokens
  application/     one use-case per file, orchestrates ports
  infrastructure/  adapters: Prisma repositories, HTTP/RPC clients, SDK wrappers
  presentation/    controllers + zod-validated DTOs
  <name>.module.ts wiring (providers bound to tokens)
```

| Module | Responsibility | Key ports |
| --- | --- | --- |
| `startups` | Startup + Round registry, milestones | `StartupRepository`, `RoundRepository` |
| `data-room` | Collect normalized `Signal[]` from many providers | `DataProvider` (Token API, Messari, Agent0, Arc escrow) |
| `due-diligence` | Evaluators → `Finding[]` → scored report, including **growth** read as a slope | `SignalEvaluator`, `ReportRepository` |
| `payments` | x402 server (Hedera/Blocky402) + x402 client for agents; receipts | `PaidDataClient`, `PaymentReceiptRepository` |
| `settlement` | Arc escrow interaction; wallets; spending policy | `SettlementRail`, `EscrowReader`, `AgentWalletFactory` |
| `agents` | Mandates, ERC-8004 identity, decision engines, run loop | `DecisionEngine`, `AgentIdentity`, `AgentRepository` |
| `audit` | Append-only log mirrored to Hedera Consensus Service | `AuditLog`, `ConsensusPublisher` |
| `returns` | Round lifecycle (finalize, milestones, exit settlement) and agent claims | `EscrowOperator`, `ExitEventRepository` |

### Agent run pipeline (`agents/application/run-agent.usecase.ts`)

1. Load agent + mandate; list `OPEN` rounds matching mandate sectors.
2. For each round: **gather** the free DD report plus the founder metrics this agent may see; ask for the gated ones.
3. **Decide** via `DecisionEngine` (Claude with structured tool output, or deterministic rules).
4. **Bound** by `SpendingPolicy` (max ticket, per-round share, daily budget).
5. **Settle** through `SettlementRail.invest()` on Arc → `Investment` row with tx hash.
6. **Audit** each step to HCS.

## 5. REST surface

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/startups` | create startup |
| GET | `/startups`, `/startups/:id` | |
| POST | `/rounds` | create round (also creates on-chain round in escrow) |
| GET | `/rounds`, `/rounds/:id` | includes startup + investments |
| POST | `/data-room/startups/:id/refresh` | re-collect signals from all providers |
| GET | `/data-room/startups/:id/signals` | latest normalized signals |
| POST | `/due-diligence/rounds/:id/generate` | build report from latest signals |
| GET | `/due-diligence/rounds/:id` | free preview (score + summary) |
| GET | `/due-diligence/rounds/:id/premium` | full report (x402-gated only when `X402_GATE_REPORTS=true`) |
| POST | `/agents` | create agent (wallet, Hedera account, mandate) |
| GET | `/agents`, `/agents/:id` | |
| POST | `/agents/:id/identity` | register ERC-8004 identity |
| POST | `/agents/:id/run` | execute pipeline over open rounds |
| POST | `/agents/:id/runs` | start an async run → `{runId}` |
| POST | `/rounds/:id/swarm` | every agent evaluates one round concurrently → `{runs}` |
| GET | `/runs`, `/runs/:runId/events` (SSE), `/events` (SSE) | run history, per-run stream, global firehose of `RunEvent`s |
| GET | `/agents/:id/decisions`, `/decisions` | decision feed |
| GET | `/due-diligence/rounds/:id/history` | score history for sparklines |
| GET | `/stats` | KPI strip |
| POST | `/rounds/:id/finalize`, `/rounds/:id/milestones/release`, `/rounds/:id/exit`, `/rounds/:id/sync` | operator lifecycle on the Arc escrow |
| GET | `/rounds/:id/returns`, `/rounds/:id/exits` | stake, entry valuation, proceeds, multiple, per-investor claimable/claimed |
| GET/POST | `/data-room/startups/:id/metrics` | founder metrics as time series; gated ones come back withheld |
| POST | `/data-room/startups/:id/access`, `/data-room/access/:id/grant\|deny` | an agent asks, the founder opens |
| GET | `/decisions/pending` · POST `/decisions/:id/approve\|reject` | proposals from advisory agents |
| POST | `/agents/:id/run`, `/agents/:id/pause` | background research on or off |
| POST | `/agents/:id/claim?roundId=` | agent claims its share of the exit with its own key |
| GET | `/payments/receipts` | x402 receipts |
| GET | `/audit` | audit entries with HCS sequence numbers |
| GET | `/health` | |

## 6. Degraded mode & dev stand-ins

Every adapter registers only when its credentials exist (`AppConfig.features`), so the API boots with
nothing but `DATABASE_URL`. For offline development:

- `DEMO_SIGNALS=true` registers `DemoFixtureProvider` (signals tagged `demo-fixture`, never used when unset).
- `pnpm --filter @agentipo/api dev:facilitator-stub` is an accept-all x402 facilitator on :3999.
- `anvil --chain-id 5042002` + MockUSDC at `0x3600…0000` stands in for Arc (see README).
- The premium report endpoint generates the report (and collects the data room) on first request, so a
  paying agent always receives a report.

Persistence is Prisma 7 (Rust-free, `@prisma/adapter-pg`) with a multi-file schema in `apps/api/prisma/schema/`.

## 7. Coding rules

- Every file ≤ 100 lines (ESLint `max-lines` + `scripts/check-file-size.mjs`).
- SOLID: one reason to change per file; depend on ports, not adapters; adapters are swappable via DI tokens.
- No duplicated HTTP/GraphQL plumbing: `common/http`, `common/graph` are the only fetch call sites.
- Domain is framework-free and unit-tested with Vitest.
